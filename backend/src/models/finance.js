const { query } = require('../db');
const cache = require('../utils/cache');

const PRICE_RULES_CACHE_KEY = 'price_rules';
const PRICE_RULES_CACHE_TTL = 10 * 60 * 1000; // 价格规则缓存 10 分钟

const Finance = {
  // ========== 钱包 ==========
  async getWallet(userId) {
    let { rows } = await query('SELECT * FROM client_wallets WHERE user_id = $1', [userId]);
    if (!rows[0]) {
      rows = (await query('INSERT INTO client_wallets (user_id, balance) VALUES ($1, 0) RETURNING *', [userId])).rows;
    }
    return rows[0];
  },

  async deposit(userId, amount, description, operatorId, operatorName) {
    const client = await query('BEGIN');
    try {
      // 原子扣款/充值，避免竞态条件
      const { rows: [w] } = await query(
        'UPDATE client_wallets SET balance = balance + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING balance',
        [userId, parseFloat(amount)]
      );
      if (!w) {
        // 钱包不存在则创建
        await query('INSERT INTO client_wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET balance = client_wallets.balance + $2, updated_at = CURRENT_TIMESTAMP RETURNING balance', [userId, parseFloat(amount)]);
      }
      const newBalance = parseFloat(w?.balance ?? parseFloat(amount));
      const { rows: [tx] } = await query(
        `INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, operated_by, operated_by_name)
         VALUES ($1, 'deposit', $2, $3, $4, $5, $6) RETURNING *`,
        [userId, amount, newBalance, description || '账户充值', operatorId || null, operatorName || null]
      );
      await query('COMMIT');
      return { balance: newBalance, transaction: tx };
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  },

  async getTransactions(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { rows } = await query(
      `SELECT t.*, s.application_no FROM wallet_transactions t
       LEFT JOIN submissions s ON t.submission_id = s.id WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const { rows: [cnt] } = await query('SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1', [userId]);
    return { list: rows, total: parseInt(cnt.count) };
  },

  // ========== 价格规则 (带缓存) ==========
  async getPriceRules() {
    // 优先从缓存读取
    const cached = cache.get(PRICE_RULES_CACHE_KEY);
    if (cached) return cached;

    const { rows } = await query('SELECT * FROM price_rules ORDER BY id');
    cache.set(PRICE_RULES_CACHE_KEY, rows, PRICE_RULES_CACHE_TTL);
    return rows;
  },

  async updatePriceRule(id, data, operatorId, operatorName) {
    // 修改价格规则时清除缓存
    cache.del(PRICE_RULES_CACHE_KEY);
    const fields = []; const values = [id]; let idx = 2;
    if (data.unit_price !== undefined) { fields.push(`unit_price = $${idx++}`); values.push(data.unit_price); }
    if (data.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(data.is_active); }
    if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
    if (fields.length === 0) return null;
    fields.push('updated_at = CURRENT_TIMESTAMP');
    // Fix 5: 价格规则修改记录到操作日志表
    if (operatorId) {
      await query(
        `INSERT INTO notifications (user_id, title, content, type) VALUES ($1, '价格规则已更新', $2, 'info')`,
        [operatorId, `管理员 ${operatorName} 修改了价格规则 #${id}`]
      );
    }
    const { rows } = await query(`UPDATE price_rules SET ${fields.join(', ')} WHERE id = $1 RETURNING *`, values);
    return rows[0];
  },

  // ========== 费用计算（国际段+境内段+仓储费） ==========
  async calculateCharges(submissionId, params) {
    const route = params.route || 'nanning_bangkok';
    const allRules = await Finance.getPriceRules();
    // 全局规则（无 route 的附加服务）
    const globalRuleMap = {};
    allRules.filter(r => !r.route).forEach(r => { globalRuleMap[r.fee_type] = r; });
    // 路线专属规则（按 route 筛选）
    const routeRuleMap = {};
    allRules.filter(r => r.route === route).forEach(r => { routeRuleMap[r.fee_type] = r; });

    const volume = parseFloat(params.volume) || 0;
    const weight = parseFloat(params.weight) || 0;
    const charges = [];

    // ========== 第一段：国际运费（择大计费）==========
    // 体积单价：根据体积落在哪个阶梯
    // 优先查阶梯单价，不存在则回退到统一单价 freight_cbm
    const isYiwu = route === 'yiwu_bangkok';
    let cbmPrice;
    if (isYiwu) {
      // 义乌路线：≤5m³ 用高价，>5m³ 用低价（阶梯方向与其他路线相反）
      if (volume <= 5) cbmPrice = parseFloat(routeRuleMap.freight_cbm_small?.unit_price || routeRuleMap.freight_cbm?.unit_price || 0);
      else cbmPrice = parseFloat(routeRuleMap.freight_cbm_large?.unit_price || routeRuleMap.freight_cbm?.unit_price || 0) || cbmPrice;
    } else {
      // 南宁/广州路线：<5m³ 用高价，≥5m³ 用低价
      if (volume < 5) cbmPrice = parseFloat(routeRuleMap.freight_cbm_small?.unit_price || routeRuleMap.freight_cbm?.unit_price || 0);
      else cbmPrice = parseFloat(routeRuleMap.freight_cbm_large?.unit_price || routeRuleMap.freight_cbm?.unit_price || 0) || cbmPrice;
    }

    // 重量单价：根据重量落在哪个阶梯（所有路线统一：<1000kg 用高价，≥1000kg 用低价）
    // 优先查阶梯单价，不存在则回退到统一单价 freight_kg
    let kgPrice;
    if (weight < 1000) kgPrice = parseFloat(routeRuleMap.freight_kg_small?.unit_price || routeRuleMap.freight_kg?.unit_price || 0);
    else kgPrice = parseFloat(routeRuleMap.freight_kg_large?.unit_price || routeRuleMap.freight_kg?.unit_price || 0) || kgPrice;

    const cbmAmount = volume * cbmPrice;
    const kgAmount = weight * kgPrice;
    const intlAmount = Math.max(cbmAmount, kgAmount);
    const useCbm = cbmAmount >= kgAmount;

    // 体积费用明细
    charges.push({
      fee_type: 'freight_cbm', fee_name: `国际运费-按体积(${volume} m³ × ${cbmPrice} ฿/m³)`, quantity: volume,
      unit_price: cbmPrice, amount: Math.round(cbmAmount * 100) / 100, is_optional: false, selected: useCbm,
    });
    // 重量费用明细
    charges.push({
      fee_type: 'freight_kg', fee_name: `国际运费-按重量(${weight} kg × ${kgPrice} ฿/kg)`, quantity: weight,
      unit_price: kgPrice, amount: Math.round(kgAmount * 100) / 100, is_optional: false, selected: !useCbm,
    });
    // 择大标注（仅展示用，amount=0 不计入 total）
    charges.push({
      fee_type: 'freight_max_note', fee_name: `→ 取较大值: ${useCbm ? '按体积' : '按重量'} ${Math.round(intlAmount * 100) / 100} ฿`, quantity: 0,
      unit_price: 0, amount: 0, is_optional: false, selected: false,
    });

    // 附加服务（全部默认不勾选，员工手动勾选）
    const rThaiCustoms = globalRuleMap.thai_customs;
    if (rThaiCustoms) charges.push({ fee_type: 'thai_customs', fee_name: rThaiCustoms.fee_name, quantity: 1, unit_price: parseFloat(rThaiCustoms.unit_price), amount: parseFloat(rThaiCustoms.unit_price), is_optional: true, selected: false });

    const rCustomsHandling = globalRuleMap.customs_handling;
    if (rCustomsHandling) charges.push({ fee_type: 'customs_handling', fee_name: rCustomsHandling.fee_name, quantity: 1, unit_price: parseFloat(rCustomsHandling.unit_price), amount: parseFloat(rCustomsHandling.unit_price), is_optional: true, selected: false });

    const rChinaCustoms = globalRuleMap.china_customs;
    if (rChinaCustoms) charges.push({ fee_type: 'china_customs', fee_name: rChinaCustoms.fee_name, quantity: 1, unit_price: parseFloat(rChinaCustoms.unit_price), amount: parseFloat(rChinaCustoms.unit_price), is_optional: true, selected: false });

    const rFormE = globalRuleMap.form_e;
    if (rFormE) charges.push({ fee_type: 'form_e', fee_name: rFormE.fee_name, quantity: 1, unit_price: parseFloat(rFormE.unit_price), amount: parseFloat(rFormE.unit_price), is_optional: true, selected: false });

    const palletQty = parseFloat(params.pallet_count) || 0;
    const rPallet = globalRuleMap.pallet;
    if (rPallet) charges.push({ fee_type: 'pallet', fee_name: rPallet.fee_name, quantity: palletQty, unit_price: parseFloat(rPallet.unit_price), amount: palletQty > 0 ? Math.round(palletQty * parseFloat(rPallet.unit_price) * 100) / 100 : 0, is_optional: true, selected: false });

    const boxCbm = parseFloat(params.wooden_box_cbm) || 0;
    const boxRule = globalRuleMap.wooden_box;
    if (boxRule) {
      let boxAmount = boxCbm > 0 ? Math.round(boxCbm * parseFloat(boxRule.unit_price) * 100) / 100 : 0;
      if (boxAmount > 0 && boxAmount < 1000) boxAmount = 1000;
      charges.push({ fee_type: 'wooden_box', fee_name: boxRule.fee_name, quantity: boxCbm, unit_price: parseFloat(boxRule.unit_price), amount: boxAmount, is_optional: true, selected: false });
    }

    // ========== 第二段：境内运费（仅备注，不自动计费）==========
    const logistics = params.domestic_logistics || '';
    const domesticNames = {
      bluewhite: 'BlueWhite 蓝白物流 — 费用额外另算',
      flash: 'Flash Express — 费用额外另算',
      kerry: 'Kerry Express — 费用额外另算',
      nim: 'Nim Express — 费用额外另算',
      lalamove: 'Lalamove 包车派送 — 费用额外另算',
      nss: 'NSS 曼谷自提 — 免费 0 ฿',
    };
    const domesticName = domesticNames[logistics] || (logistics ? logistics + ' — 费用额外另算' : '未选择');

    charges.push({ fee_type: 'domestic_freight', fee_name: domesticName, quantity: 1, unit_price: 0, amount: 0, is_optional: false, selected: true });

    // ========== 第三段：仓储费 ==========
    let storageAmount = 0;
    const entryDate = params.warehouse_entry_date;
    if (entryDate) {
      const entry = new Date(entryDate);
      const now = new Date();
      const days = Math.max(0, Math.floor((now - entry) / (1000 * 60 * 60 * 24)));
      const chargeDays = Math.max(0, days - 5);
      if (chargeDays > 0) {
        const billVolume = Math.max(1, Math.ceil(volume));
        storageAmount = billVolume * chargeDays * 100;
        charges.push({ fee_type: 'storage', fee_name: `仓储费(体积${billVolume}m³ × ${chargeDays}天 × 100฿)`, quantity: chargeDays, unit_price: billVolume * 100, amount: Math.round(storageAmount * 100) / 100, is_optional: false, selected: true });
      }
    }

    // 保存到 submission_charges（仅当有真实submissionId时存库）
    if (submissionId) {
      const { rows: [oldSub] } = await query('SELECT domestic_logistics, international_route, warehouse_entry_date FROM submissions WHERE id = $1', [submissionId]);
      const { rows: oldCharges } = await query('SELECT fee_type, selected FROM submission_charges WHERE submission_id = $1', [submissionId]);
      const oldSelected = oldCharges.filter(c => c.selected).map(c => c.fee_type);
      // 保留旧的勾选状态（员工已勾选过的服务，重新计算时保持勾选）
      const oldSelectedMap = {};
      for (const oc of oldCharges) oldSelectedMap[oc.fee_type] = oc.selected;

      // 查询退税信息，决定中国报关费是否展示
      const { rows: [rebateRow] } = await query(
        'SELECT need_rebate FROM submission_tax_rebate WHERE submission_id = $1', [submissionId]
      );
      const needRebate = rebateRow?.need_rebate === true;

      // 应用必选逻辑：thai_customs/customs_handling 始终必选，china_customs 仅退税时展示并必选
      const chargesToSave = [];
      for (const c of charges) {
        if (c.fee_type === 'thai_customs') {
          c.selected = true;  // 泰国清关费始终必选
        } else if (c.fee_type === 'customs_handling') {
          c.selected = true;  // 清关手续费始终必选
        } else if (c.fee_type === 'china_customs') {
          if (!needRebate) continue;  // 不退税时不展示
          c.selected = true;  // 退税时必选
        } else if (oldSelectedMap[c.fee_type] === true) {
          c.selected = true;  // 其他附加服务保留旧勾选
        }
        chargesToSave.push(c);
      }

      await query('DELETE FROM submission_charges WHERE submission_id = $1', [submissionId]);
      const newSelected = [];
      for (const c of chargesToSave) {
        await query(
          `INSERT INTO submission_charges (submission_id, fee_type, fee_name, quantity, unit_price, amount, is_optional, selected)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [submissionId, c.fee_type, c.fee_name, c.quantity, c.unit_price, c.amount, c.is_optional, c.selected]
        );
        if (c.selected && c.is_optional) newSelected.push(c.fee_type);
      }
      if (logistics) await query('UPDATE submissions SET domestic_logistics = $1 WHERE id = $2', [logistics, submissionId]);
      if (route) await query('UPDATE submissions SET international_route = $1 WHERE id = $2', [route, submissionId]);
      if (entryDate) {
        const e = new Date(entryDate); const n = new Date();
        const days = Math.max(0, Math.floor((n - e) / (1000 * 60 * 60 * 24)));
        await query('UPDATE submissions SET warehouse_entry_date = $1, storage_days = $2, storage_fee = $3 WHERE id = $4',
          [entryDate, Math.max(0, days - 5), storageAmount, submissionId]);
      }

      // 记录费用修改日志
      const changes = [];
      const routeNames = { nanning_bangkok: '南宁', guangzhou_bangkok: '广州深圳', yiwu_bangkok: '义乌' };
      if (route && route !== oldSub?.international_route) changes.push(`路线: ${routeNames[oldSub?.international_route] || '未设置'} → ${routeNames[route] || route}`);
      if (logistics && logistics !== oldSub?.domestic_logistics) changes.push(`境内物流: ${oldSub?.domestic_logistics || '未设置'} → ${logistics}`);
      if (entryDate !== (oldSub?.warehouse_entry_date || '')) changes.push(`入仓日期: ${oldSub?.warehouse_entry_date || '未设置'} → ${entryDate || '未设置'}`);
      const added = newSelected.filter(s => !oldSelected.includes(s));
      const removed = oldSelected.filter(s => !newSelected.includes(s));
      if (added.length) changes.push(`新增附加服务: ${added.join(', ')}`);
      if (removed.length) changes.push(`取消附加服务: ${removed.join(', ')}`);
      changes.push(`体积: ${volume} m³, 重量: ${weight} kg`);

      const detail = changes.join('; ');
      const employeeId = params._employee_id || null;
      if (employeeId) {
        await query(
          `INSERT INTO review_logs (submission_id, employee_id, action, comment) VALUES ($1, $2, 'fee_update', $3)`,
          [submissionId, employeeId, detail]
        );
      }
    }

    // 包含海关关税
    let customsDuty = 0;
    if (submissionId) {
      const { rows: [sd] } = await query('SELECT COALESCE(customs_duty_amount, 0) AS cda FROM submissions WHERE id = $1', [submissionId]);
      customsDuty = parseFloat(sd?.cda || 0);
    }
    const subtotal = charges.reduce((s, c) => s + (c.selected ? c.amount : 0), 0) + customsDuty;
    const total = Math.round(subtotal * 1.07);
    return { charges, subtotal: Math.round(subtotal * 100) / 100, total: Math.round(total * 100) / 100, domestic_freight: 0, storage_fee: storageAmount, customs_duty_amount: customsDuty };
  },

  async getSubmissionCharges(submissionId) {
    const { rows } = await query('SELECT * FROM submission_charges WHERE submission_id = $1 ORDER BY is_optional, id', [submissionId]);
    const { rows: [log] } = await query('SELECT * FROM submission_charge_logs WHERE submission_id = $1 ORDER BY id DESC LIMIT 1', [submissionId]);
    const { rows: [sub] } = await query('SELECT COALESCE(customs_duty_amount, 0) AS customs_duty_amount FROM submissions WHERE id = $1', [submissionId]);
    const customsDuty = parseFloat(sub?.customs_duty_amount || 0);
    const subtotal = rows.filter(c => c.selected).reduce((s, c) => s + parseFloat(c.amount), 0) + customsDuty;
    const total = Math.round(subtotal * 1.07);
    return { charges: rows, subtotal: Math.round(subtotal * 100) / 100, total: Math.round(total * 100) / 100, charge_log: log || null, customs_duty_amount: customsDuty };
  },

  async updateCharges(submissionId, charges) {
    // 查询退税信息，决定中国报关费是否展示
    const { rows: [rebateRow] } = await query(
      'SELECT need_rebate FROM submission_tax_rebate WHERE submission_id = $1', [submissionId]
    );
    const needRebate = rebateRow?.need_rebate === true;

    for (const c of charges) {
      // 强制必选逻辑：thai_customs/customs_handling 始终 true，china_customs 退税时 true
      if (c.fee_type === 'thai_customs') c.selected = true;
      if (c.fee_type === 'customs_handling') c.selected = true;
      if (c.fee_type === 'china_customs') c.selected = needRebate;
      await query(
        `UPDATE submission_charges SET selected = $3, quantity = $4, amount = $5, updated_at = CURRENT_TIMESTAMP
         WHERE submission_id = $1 AND fee_type = $2`,
        [submissionId, c.fee_type, c.selected, c.quantity || 1, c.amount || 0]
      );
    }
    return Finance.getSubmissionCharges(submissionId);
  },

  // ========== Fix 4: 余额检查（只检查不扣款）==========
  async checkBalance(submissionId) {
    const { rows: [sub] } = await query('SELECT user_id FROM submissions WHERE id = $1', [submissionId]);
    if (!sub) throw new Error('申请不存在');
    const { total } = await Finance.getSubmissionCharges(submissionId);
    const wallet = await Finance.getWallet(sub.user_id);
    return {
      user_id: sub.user_id,
      balance: parseFloat(wallet.balance),
      total_amount: total,
      sufficient: parseFloat(wallet.balance) >= total,
    };
  },

  // ========== 货物到仓扣款（原子操作 + 事务） ==========
  async chargeSubmission(submissionId, operatorId, operatorName) {
    const check = await Finance.checkBalance(submissionId);
    if (!check.sufficient) throw new Error(`余额不足，当前余额 ¥${check.balance}，应收 ¥${check.total_amount}，请通知客户充值`);
    await query('BEGIN');
    try {
      // 原子扣款：balance = balance - amount RETURNING 新余额
      const { rows: [w] } = await query(
        'UPDATE client_wallets SET balance = balance - $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING balance',
        [check.user_id, check.total_amount]
      );
      const newBalance = parseFloat(w.balance);
      await query(
        `INSERT INTO wallet_transactions (user_id, submission_id, type, amount, balance_after, description, operated_by, operated_by_name)
         VALUES ($1, $2, 'charge', $3, $4, $5, $6, $7)`,
        [check.user_id, submissionId, check.total_amount, newBalance, '货物到仓自动扣款', operatorId || null, operatorName || null]
      );
      await query(
        `INSERT INTO submission_charge_logs (submission_id, total_amount, status, charged_at, operated_by, operated_by_name)
         VALUES ($1, $2, 'charged', CURRENT_TIMESTAMP, $3, $4)`,
        [submissionId, check.total_amount, operatorId || null, operatorName || null]
      );
      await query('COMMIT');
      return { ...check, new_balance: newBalance, status: 'charged' };
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  },

  async refundSubmission(submissionId, operatorId, operatorName) {
    const { rows: [log] } = await query("SELECT * FROM submission_charge_logs WHERE submission_id = $1 AND status = 'charged' ORDER BY id DESC LIMIT 1", [submissionId]);
    if (!log) throw new Error('未找到扣费记录');
    const { rows: [sub] } = await query('SELECT user_id FROM submissions WHERE id = $1', [submissionId]);
    await query('BEGIN');
    try {
      // 原子退款：balance = balance + amount RETURNING 新余额
      const { rows: [w] } = await query(
        'UPDATE client_wallets SET balance = balance + $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING balance',
        [sub.user_id, parseFloat(log.total_amount)]
      );
      const newBalance = parseFloat(w.balance);
      await query(
        `INSERT INTO wallet_transactions (user_id, submission_id, type, amount, balance_after, description, operated_by, operated_by_name)
         VALUES ($1, $2, 'refund', $3, $4, $5, $6, $7)`,
        [sub.user_id, submissionId, log.total_amount, newBalance, '退款冲正', operatorId || null, operatorName || null]
      );
      await query("UPDATE submission_charge_logs SET status = 'refunded', refunded_at = CURRENT_TIMESTAMP WHERE id = $1", [log.id]);
      await query('COMMIT');
      return { refunded_amount: parseFloat(log.total_amount), new_balance: newBalance };
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  },

  // ========== Fix 3: 标记到仓 ==========
  async markArrived(submissionId, employeeId, employeeName) {
    await query('UPDATE submissions SET arrived_at_warehouse = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [submissionId]);
    // 记录到 review_logs (action=arrived)
    await query(
      `INSERT INTO review_logs (submission_id, employee_id, action, comment) VALUES ($1, $2, 'arrived', '货物已到达泰国仓库')`,
      [submissionId, employeeId]
    );
    // 自动扣款
    return Finance.chargeSubmission(submissionId, employeeId, employeeName);
  },

  // ========== Fix 2: 通知 ==========
  async createNotification(userId, title, content, type, relatedType, relatedId) {
    await query(
      `INSERT INTO notifications (user_id, title, content, type, related_type, related_id) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, title, content || null, type || 'info', relatedType || null, relatedId || null]
    );
  },

  async getNotifications(userId) {
    const { rows } = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return rows;
  },

  async getUnreadCount(userId) {
    const { rows: [c] } = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(c.count);
  },

  async markRead(id, userId) {
    await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, userId]);
  },

  async markAllRead(userId) {
    await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
  },

  // ========== 充值申请审核 ==========

  async createDepositRequest(userId, amount, description, slipPath) {
    var r = await query(
      'INSERT INTO deposit_requests (user_id, amount, description, payment_slip) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, amount, description || null, slipPath || null]
    );
    var req = r.rows[0];
    var emps = await query(
      "SELECT id FROM users WHERE role IN ('employee','admin') AND status = 'active'"
    );
    for (var i = 0; i < emps.rows.length; i++) {
      await Finance.createNotification(emps.rows[i].id, "新的充值申请",
        '客户提交了一笔充值申请，金额：' + amount + ' ฿，请尽快审核',
        'warning', 'deposit', req.id);
    }
    return req;
  },

  async getDepositRequests(filter, page, pageSize, userId) {
    var offset = (page - 1) * pageSize;
    var where = "";
    var params = [];
    if (userId) {
      where = "WHERE dr.user_id = $1";
      params.push(userId);
    }
    if (filter === 'pending') {
      where += (where ? ' AND' : 'WHERE') + " dr.status = 'pending'";
    } else if (filter === 'processed') {
      where += (where ? ' AND' : 'WHERE') + " dr.status IN ('approved', 'rejected')";
    }
    var cntResult = await query("SELECT COUNT(*) FROM deposit_requests dr " + where, params);
    var total = parseInt(cntResult.rows[0].count);
    var p1 = params.length + 1;
    var p2 = params.length + 2;
    var sql = "SELECT dr.*, u.username FROM deposit_requests dr JOIN users u ON dr.user_id = u.id " + where + " ORDER BY dr.created_at DESC LIMIT $" + p1 + " OFFSET $" + p2;
    var rowsResult = await query(sql, params.concat([pageSize, offset]));
    return { list: rowsResult.rows, total: total, page: page, pageSize: pageSize };
  },

  async reviewDepositRequest(requestId, action, reviewerId, comment) {
    var reqResult = await query("SELECT * FROM deposit_requests WHERE id = $1", [requestId]);
    var req = reqResult.rows[0];
    if (!req) throw new Error('充值申请不存在');
    if (req.status !== 'pending') throw new Error('该申请已被处理');
    var newStatus = action === 'approve' ? 'approved' : 'rejected';
    await query(
      'UPDATE deposit_requests SET status = $1, reviewed_by = $2, review_comment = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
      [newStatus, reviewerId, comment || null, requestId]
    );
    if (action === 'approve') {
      var result = await Finance.deposit(req.user_id, parseFloat(req.amount),
        req.description || '充值申请通过', reviewerId, null);
      await Finance.createNotification(req.user_id, '充值申请已通过',
        '您的充值申请（金额：' + req.amount + ' ฿）已审核通过，余额已到账',
        'success', 'deposit', requestId);
      return { approved: true, balance: result.balance };
    } else {
      var msg = '您的充值申请（金额：' + req.amount + ' ฿）已被拒绝';
      if (comment) msg += '，原因：' + comment;
      await Finance.createNotification(req.user_id, '充值申请已拒绝', msg, 'warning', 'deposit', requestId);
      return { approved: false };
    }
  },
};

module.exports = Finance;
