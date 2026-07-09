<template>
  <div class="review-detail" v-loading="loading">
    <!-- 头部 -->
    <div class="detail-header">
      <el-button text @click="$router.push('/employee/review')">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
      <div class="header-info">
        <h2>审核详情 {{ data.application_no ? '#' + data.application_no : '' }}</h2>
        <el-tag :type="statusTag(data.review_status)">
          {{ statusLabel(data.review_status) }}
        </el-tag>
        <span class="header-meta">客户: {{ data.client_name }} | 提交: {{ formatDate(data.created_at) }}</span>
      </div>
    </div>

    <!-- 5个Tab -->
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="产品信息" name="step1">
        <div class="tab-content">
          <h4>客户填写</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="产品泰文名称">{{ step1?.thai_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="产品英文名称">{{ step1?.english_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="产品描述" :span="2">{{ step1?.product_description || '-' }}</el-descriptions-item>
            <el-descriptions-item label="产品图片" :span="2">
              <span v-if="!step1?.product_images?.length">无</span>
              <el-image
                v-for="(img, i) in step1?.product_images || []"
                :key="i"
                :src="imgUrl(img)"
                style="width:80px;height:80px;margin-right:8px"
                fit="cover"
                :preview-src-list="[imgUrl(img)]"
              />
            </el-descriptions-item>
          </el-descriptions>

          <h4 style="margin-top:20px">员工确认</h4>
          <el-form :model="reviewForm" label-width="140px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="HS Code">
                  <el-input v-model="reviewForm.hs_code" placeholder="例如: 8471.30.0100" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="关税税率">
                  <el-input v-model="reviewForm.tax_rate" placeholder="例如: 5%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="是否可用 Form E">
                  <el-switch v-model="reviewForm.need_form_e" active-text="可用" inactive-text="不可用" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="是否需要许可证">
                  <el-switch v-model="reviewForm.need_license" active-text="需要" inactive-text="不需要" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="16" v-if="reviewForm.need_license">
              <el-col :span="12">
                <el-form-item label="许可证类型">
                  <el-select v-model="reviewForm.license_type" placeholder="选择证件类型" style="width:100%" @change="setLicenseType">
                    <el-option label="FDA 食品药品监督管理局" value="FDA" />
                    <el-option label="TISI 泰国工业标准协会" value="TISI" />
                    <el-option label="NBTC 泰国广播通信委员会" value="NBTC" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 许可证文件上传和列表 -->
            <el-row :gutter="16" v-if="reviewForm.license_type" style="margin-top:16px">
              <el-col :span="24">
                <h4 style="margin-bottom:8px">上传许可证文件 <el-tag size="small" type="danger">必填</el-tag></h4>
                <el-upload
                  :action="'/api/employee/submissions/' + data.id + '/upload-license'"
                  :headers="uploadHeaders"
                  :data="{ license_type: reviewForm.license_type, stage: 1 }"
                  :on-success="onLicenseUploadSuccess"
                  :show-file-list="false"
                >
                  <el-button type="primary" size="small"><el-icon><Upload /></el-icon> 上传 {{ reviewForm.license_type }} 证件</el-button>
                </el-upload>
                <el-table v-if="licenseDocs.length > 0" :data="licenseDocs" size="small" style="margin-top:8px">
                  <el-table-column prop="license_type" label="类型" width="80" />
                  <el-table-column prop="file_name" label="文件名" min-width="180" show-overflow-tooltip />
                  <el-table-column label="上传人" width="80">
                    <template #default="{row}">
                      <el-tag :type="row.uploaded_by === '员工' ? '' : 'info'" size="small">{{ row.uploaded_by || '客户' }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="uploaded_at" label="上传时间" width="160">
                    <template #default="{row}">{{ formatDate(row.uploaded_at) }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="80">
                    <template #default="{row}">
                      <el-link type="primary" :href="(row.url || row.file_path)" target="_blank">查看</el-link>
                    </template>
                  </el-table-column>
                </el-table>
                <div v-else style="color:#909399;font-size:13px;margin-top:8px">请上传许可证文件</div>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="公司资料" name="step2">
        <div class="tab-content">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="公司资料来源">
              <el-tag v-if="step2?.dbd_file?.original_name" type="success" size="small">已上传文件</el-tag>
              <el-tag v-else type="info" size="small">未上传</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="泰国地址">{{ step2?.thai_address || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-row :gutter="12" style="margin-top:12px">
            <el-col :span="6" v-for="f in step2Files" :key="f.label">
              <el-card shadow="hover" class="file-card" @click="openFile(f.file)" :class="{ 'clickable': f.file?.original_name }">
                <div class="file-label">{{ f.label }}</div>
                <div v-if="f.file?.original_name" class="file-ok">
                  <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                  <el-link type="primary" :underline="false" @click.stop="openFile(f.file)">{{ f.file.original_name }}</el-link>
                </div>
                <div v-else class="file-none">未上传</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <el-tab-pane label="报关授权" name="step3">
        <div class="tab-content">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="办理方式">
              <el-tag :type="step3?.handler_type === 'director' ? 'success' : 'warning'" size="small">
                {{ step3?.handler_type === 'director' ? '董事本人办理' : '委托办理' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="护照原件">
              {{ step3?.has_director_passport_original ? '已提供' : '未确认' }}
            </el-descriptions-item>
          </el-descriptions>
          <el-row :gutter="12" style="margin-top:12px" v-if="step3?.handler_type === 'agent'">
            <el-col :span="8" v-for="f in step3Files" :key="f.label">
              <el-card shadow="hover" class="file-card" @click="openFile(f.file)" :class="{ 'clickable': f.file?.original_name }">
                <div class="file-label">{{ f.label }}</div>
                <div v-if="f.file?.original_name" class="file-ok">
                  <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                  <el-link type="primary" :underline="false" @click.stop="openFile(f.file)">{{ f.file.original_name }}</el-link>
                </div>
                <div v-else class="file-none">未上传</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <el-tab-pane label="退税信息" name="step4">
        <div class="tab-content">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="退税方案">
              <el-tag :type="step4?.need_rebate ? 'warning' : 'info'" size="small">
                {{ step4?.need_rebate ? '需要退税' : '无需退税' }}
              </el-tag>
            </el-descriptions-item>
            <template v-if="step4?.need_rebate">
              <el-descriptions-item label="报关公司">{{ step4?.customs_company_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="物流对接人">{{ step4?.logistics_contact || '-' }}</el-descriptions-item>
              <el-descriptions-item label="物流编码">{{ step4?.logistics_code || '-' }}</el-descriptions-item>
            </template>
            <template v-else>
              <el-descriptions-item label="商业发票">
                <el-link v-if="step4?.invoice_file?.original_name" type="primary" :underline="false" @click="openFile(step4.invoice_file)">
                  {{ step4.invoice_file.original_name }}
                </el-link>
                <span v-else>未上传</span>
              </el-descriptions-item>
              <el-descriptions-item label="装箱单">
                <el-link v-if="step4?.packing_list_file?.original_name" type="primary" :underline="false" @click="openFile(step4.packing_list_file)">
                  {{ step4.packing_list_file.original_name }}
                </el-link>
                <span v-else>未上传</span>
              </el-descriptions-item>
            </template>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <el-tab-pane label="发货信息" name="step5">
        <div class="tab-content">
          <!-- 收货仓库地址 -->
          <el-alert v-if="warehouse" type="info" :closable="false" show-icon style="margin-bottom:16px">
            <template #title><span style="font-weight:700">收货仓库 — 客户将自行发货至此地址</span></template>
            <div style="font-size:13px;line-height:1.6">
              <strong>{{ warehouse.name }}</strong>　{{ warehouse.address }}<br/>
              联系人：{{ warehouse.contact_person }}　电话：{{ warehouse.contact_phone }}
            </div>
          </el-alert>

          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="快递公司">{{ data?.tracking_company || '-' }}</el-descriptions-item>
            <el-descriptions-item label="运单号">{{ data?.tracking_number || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发货时间">{{ formatDate(data?.shipped_at) }}</el-descriptions-item>
          </el-descriptions>

          <h4 style="margin-top:14px">批次号</h4>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item>
              <template #label>Next给的批次号 <el-tag type="warning" size="small" style="margin-left:6px">填完后客户才能看到仓库地址</el-tag></template>
              <div style="display:flex;align-items:center;gap:8px">
                <el-input v-model="batchNumberForm.value" size="small" placeholder="填写 Next 给的批次号" style="width:240px" />
                <el-button type="primary" size="small" :loading="batchNumberSaving" @click="saveBatchNumber">保存</el-button>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-tab-pane>

      <!-- 费用明细 -->
      <el-tab-pane name="finance">
        <template #label><span><el-icon><Money /></el-icon> 费用明细</span></template>
        <div class="finance-section">
          <h4>计费参数</h4>
          <el-form :model="freightParams" inline>
            <el-form-item label="国际路线">
              <el-select v-model="freightParams.route" size="small" style="width:180px">
                <el-option label="南宁→曼谷" value="nanning_bangkok" />
                <el-option label="广州深圳→曼谷" value="guangzhou_bangkok" />
                <el-option label="义乌→曼谷" value="yiwu_bangkok" />
              </el-select>
            </el-form-item>
            <el-form-item label="境内物流">
              <el-select v-model="freightParams.domestic_logistics" size="small" style="width:160px">
                <el-option label="BlueWhite 蓝白" value="bluewhite" />
                <el-option label="Flash Express" value="flash" />
                <el-option label="Kerry Express" value="kerry" />
                <el-option label="Nim Express" value="nim" />
                <el-option label="NSS 曼谷自提" value="nss" />
                <el-option label="Lalamove 包车派送" value="lalamove" />
              </el-select>
            </el-form-item>
            <el-form-item label="体积(CBM)"><el-input-number v-model="freightParams.volume" :min="0" :step="0.1" :precision="2" size="small" /></el-form-item>
            <el-form-item label="重量(KG)"><el-input-number v-model="freightParams.weight" :min="0" :step="0.5" :precision="1" size="small" /></el-form-item>
            <el-form-item label="托盘数"><el-input-number v-model="freightParams.pallet_count" :min="0" size="small" /></el-form-item>
            <el-form-item label="木箱CBM"><el-input-number v-model="freightParams.wooden_box_cbm" :min="0" :step="0.1" :precision="2" size="small" /></el-form-item>
            <el-form-item label="入仓日期"><el-date-picker v-model="freightParams.warehouse_entry_date" type="date" size="small" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:140px" /></el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" :loading="calcLoading" @click="handleCalculate">计算费用</el-button>
              <span v-if="saveStatus === 'saving'" style="margin-left:8px;font-size:12px;color:#E6A23C"><el-icon class="is-loading"><Loading /></el-icon> 保存中</span>
              <span v-if="saveStatus === 'saved'" style="margin-left:8px;font-size:12px;color:#67C23A"><el-icon><CircleCheckFilled /></el-icon> 已保存</span>
            </el-form-item>
          </el-form>

          <!-- 运输费用（自动计算） -->
          <div v-if="charges.length > 0" style="margin-top:20px">
            <h4>国际运费明细（按体积与重量择大计费）</h4>
            <el-table :data="freightCalcCharges" size="small" stripe>
              <el-table-column prop="fee_name" label="计费方式" min-width="260" />
              <el-table-column label="数量" width="90"><template #default="{row}">{{ row.quantity }}</template></el-table-column>
              <el-table-column label="单价" width="110"><template #default="{row}">฿{{ row.unit_price }}</template></el-table-column>
              <el-table-column label="金额" width="140">
                <template #default="{row}">
                  <span :style="{ fontWeight: row.selected ? '700' : '400', color: row.selected ? '#67C23A' : '#909399' }">
                    ฿{{ row.amount }}
                    <el-tag v-if="row.selected" size="small" type="success" style="margin-left:4px">采纳</el-tag>
                  </span>
                </template>
              </el-table-column>
            </el-table>
            <div style="margin-top:6px;padding:8px 12px;background:#ecf5ff;border-radius:4px;color:#409EFF;font-weight:600;text-align:center">
              {{ maxNoteText }}
            </div>
          </div>

          <!-- 境内运费（仅备注） -->
          <div v-if="freightParams.domestic_logistics" style="margin-top:20px">
            <h4>境内运费</h4>
            <el-alert :title="domesticNote" type="info" :closable="false" show-icon />
          </div>

          <!-- 仓储费（自动计算） -->
          <div v-if="storageCharges.length > 0" style="margin-top:20px">
            <h4>仓储费</h4>
            <el-table :data="storageCharges" size="small" stripe>
              <el-table-column prop="fee_name" label="费用项目" min-width="260" />
              <el-table-column label="数量" width="80"><template #default="{row}">{{ row.quantity }}</template></el-table-column>
              <el-table-column label="单价" width="100"><template #default="{row}">฿{{ row.unit_price }}</template></el-table-column>
              <el-table-column label="金额" width="120"><template #default="{row}">฿{{ row.amount }}</template></el-table-column>
            </el-table>
          </div>

          <!-- 附加服务（手动勾选） -->
          <div v-if="serviceCharges.length > 0" style="margin-top:20px">
            <h4>附加服务（手动勾选）</h4>
            <el-table :data="serviceCharges" size="small" stripe>
              <el-table-column prop="fee_name" label="服务项目" min-width="200" />
              <el-table-column label="数量" width="80"><template #default="{row}">{{ row.quantity }}</template></el-table-column>
              <el-table-column label="单价" width="100"><template #default="{row}">฿{{ row.unit_price }}</template></el-table-column>
              <el-table-column label="金额" width="120"><template #default="{row}">฿{{ row.amount }}</template></el-table-column>
              <el-table-column v-if="data.review_status !== 'registered'" label="勾选" width="80">
                <template #default="{row}">
                  <el-switch v-model="row.selected" size="small" :disabled="row.fee_type === 'thai_customs' || (row.fee_type === 'china_customs' && step4?.need_rebate)" @change="recalcTotalWithSave" />
                </template>
              </el-table-column>
            </el-table>
            <div style="text-align:right;margin-top:8px;font-size:15px;font-weight:600;color:#E6A23C">附加服务合计: ฿{{ serviceTotal }}</div>
          </div>

          <!-- 代垫费用：海关关税 -->
          <div style="margin-top:20px">
            <h4>代垫费用 <el-tag type="info" size="small" style="margin-left:6px">实报实销</el-tag></h4>
            <el-form :model="customsDutyForm" inline>
              <el-form-item label="海关关税 (฿)">
                <el-input-number v-model="customsDutyForm.amount" :min="0" :step="100" :precision="2" size="small" style="width:180px" placeholder="根据Next账单填写" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="small" :loading="customsDutySaving" @click="saveCustomsDuty">保存关税</el-button>
              </el-form-item>
            </el-form>
            <div v-if="customsDutyForm.amount > 0" style="text-align:right;font-size:13px;color:#E6A23C">代垫费用: ฿{{ customsDutyForm.amount }}</div>
          </div>

          <!-- 费用汇总 -->
          <div v-if="charges.length > 0" class="summary-section">
            <h4>费用汇总</h4>
            <div class="summary-rows">
              <div class="summary-row">
                <span>国际运费</span>
                <span>{{ intlFreightAmount.toLocaleString() }} ฿</span>
              </div>

              <div v-if="storageAmount > 0" class="summary-row">
                <span>仓储费</span>
                <span>{{ storageAmount.toLocaleString() }} ฿</span>
              </div>
              <div v-if="parseFloat(serviceTotal) > 0" class="summary-row">
                <span>附加服务</span>
                <span>{{ parseFloat(serviceTotal).toLocaleString() }} ฿</span>
              </div>
              <el-divider style="margin:8px 0" />
              <div v-if="customsDutyForm.amount > 0" class="summary-row" style="color:#E6A23C">
                <span>海关关税（代垫）</span>
                <span>{{ customsDutyForm.amount.toLocaleString() }} ฿</span>
              </div>
              <el-divider v-if="customsDutyForm.amount > 0" style="margin:8px 0" />
              <div class="summary-row summary-row-total">
                <span>总计</span>
                <span>{{ (parseFloat(totalAmount) + (customsDutyForm.amount || 0)).toLocaleString() }} ฿</span>
              </div>
            </div>
            <div style="margin-top:16px;display:flex;align-items:center;gap:16px">
              <el-statistic title="客户余额" :value="'฿' + balanceInfo.balance">
                <template #suffix><el-tag :type="balanceInfo.sufficient ? 'success' : 'danger'" size="small">{{ balanceInfo.sufficient ? '充足' : '不足' }}</el-tag></template>
              </el-statistic>
              <el-button type="info" size="small" :loading="balanceLoading" @click="handleCheckBalance">检查余额</el-button>
            </div>
          </div>

          <!-- 付款状态区块 -->
          <div v-if="chargeLog?.status==='charged'" class="pay-block pay-done" style="margin-top:16px">
            <div class="pay-icon-wrap"><el-icon :size="36" color="#fff"><CircleCheckFilled /></el-icon></div>
            <div class="pay-text">
              <div class="pay-title">已扣款</div>
              <div class="pay-amount">{{ (chargeLog.total_amount || 0).toLocaleString() }} ฿</div>
              <div class="pay-time">扣款时间：{{ formatDate(chargeLog.charged_at) }}</div>
            </div>
          </div>
          <div v-else-if="chargeLog?.status==='refunded'" class="pay-block pay-refund" style="margin-top:16px">
            <div class="pay-icon-wrap"><el-icon :size="36" color="#fff"><WarningFilled /></el-icon></div>
            <div class="pay-text">
              <div class="pay-title">已退款</div>
              <div class="pay-amount">{{ (chargeLog.total_amount || 0).toLocaleString() }} ฿</div>
            </div>
          </div>
          <div v-else-if="charges.length > 0" class="pay-block pay-pending" style="margin-top:16px">
            <div class="pay-icon-wrap"><el-icon :size="36" color="#fff"><Clock /></el-icon></div>
            <div class="pay-text">
              <div class="pay-title">待扣款</div>
              <div class="pay-amount">应收 {{ parseFloat(totalAmount).toLocaleString() }} ฿</div>
              <div class="pay-time">推进到「已到泰国仓库」时自动扣款</div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Next 注册区域（审核通过后显示） -->
    <el-card v-if="data.review_status === 'approved' || data.review_status === 'registered'" class="next-section" shadow="hover">
      <template #header>
        <span><el-icon><Connection /></el-icon> Next 注册结果录入</span>
      </template>
      <el-form :model="nextForm" label-width="120px" inline>
        <el-form-item label="Next 账号">
          <el-input v-model="nextForm.next_account" placeholder="Next 系统注册账号" :disabled="data.review_status === 'registered'" />
        </el-form-item>
        <el-form-item label="注册状态">
          <el-select v-model="nextForm.register_status" placeholder="选择状态" :disabled="data.review_status === 'registered'">
            <el-option label="注册成功" value="success" />
            <el-option label="注册失败" value="failed" />
            <el-option label="注册中" value="pending" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="nextForm.notes" placeholder="注册备注" :disabled="data.review_status === 'registered'" />
        </el-form-item>
        <el-form-item v-if="data.review_status === 'approved'">
          <el-button type="primary" :loading="registering" @click="handleNextRegister">保存注册结果</el-button>
        </el-form-item>
      </el-form>
      <div v-if="data.review_status === 'registered'" class="registered-info">
        <el-tag type="success">已注册</el-tag>
        账号: {{ data.next_account || '-' }} | 注册状态: {{ data.next_register_status || '-' }}
      </div>
    </el-card>

    <!-- 跟踪时间线 -->
    <el-card class="timeline-card" style="margin-top:20px" shadow="hover">
      <template #header><span><el-icon><Clock /></el-icon> 操作轨迹</span></template>
      <el-timeline v-if="timeline.length > 0">
        <el-timeline-item
          v-for="(item, idx) in timeline"
          :key="idx"
          :timestamp="formatDate(item.time)"
          placement="top"
          :color="item.color"
          :icon="item.icon"
        >
          {{ item.title }}
        </el-timeline-item>
      </el-timeline>
      <div v-else class="no-timeline">暂无操作记录</div>
    </el-card>

    <!-- 退回原因展示 -->
    <el-alert
      v-if="data.review_status === 'rejected' && data.review_comment"
      type="error" :closable="false" show-icon style="margin-top:16px"
    >
      <template #title>退回原因</template>
      {{ data.review_comment }}
    </el-alert>

    <!-- 底部操作栏 -->
    <div class="detail-footer" v-if="data.review_status === 'pending'">
      <el-button type="success" size="large" @click="handleReview('approve')" :loading="acting">
        <el-icon><CircleCheckFilled /></el-icon> 审核通过
      </el-button>
      <el-button type="warning" size="large" @click="handleSaveReviewForm" :loading="savingForm">
        <el-icon><FolderChecked /></el-icon> 保存审核信息
      </el-button>
      <el-button type="danger" size="large" @click="handleReview('reject')" :loading="acting">
        <el-icon><CircleCloseFilled /></el-icon> 退回
      </el-button>
    </div>

    <!-- 订单状态推进（审核通过后可见） -->
    <el-card v-if="data.review_status === 'approved' || data.review_status === 'registered'" class="status-card" shadow="hover">
      <template #header>
        <span><el-icon><Timer /></el-icon> 订单状态追踪</span>
      </template>
      <div class="status-section">
        <div class="status-current">
          <span class="status-label">当前状态</span>
          <el-tag :color="currentStatus.color" :type="currentStatus.tagType" size="large" effect="dark" style="font-size:15px">
            {{ currentStatus.label }}
          </el-tag>
          <span class="status-time" v-if="data.tracking_status_updated_at">更新于 {{ formatDate(data.tracking_status_updated_at) }}</span>
        </div>
        <div v-if="canAdvance" class="status-next">
          <span class="next-hint">下一步: <strong>{{ nextStatusLabel }}</strong></span>
          <el-button type="primary" size="large" :loading="advancing" @click="handleAdvanceStatus">
            <el-icon><Right /></el-icon>
            推进至「{{ nextStatusLabel }}」
          </el-button>
        </div>
        <el-alert v-if="nextTrackingStatus === 7" type="warning" :closable="false" show-icon style="margin-top:8px"
          title="注意" description="推进到「已到泰国仓库」将自动从客户余额扣款，请确保费用已确认且客户余额充足。" />
        <div v-if="!canAdvance" class="status-end">
          <el-icon color="#67C23A" size="24"><CircleCheckFilled /></el-icon>
          <span>订单已完成全部流程</span>
        </div>
      </div>
    </el-card>

    <!-- 海关回传文件 -->
    <el-card v-if="(data.tracking_status || 0) >= 7" class="customs-card" shadow="hover">
      <template #header><span><el-icon><FolderOpened /></el-icon> 海关回传文件</span></template>
      <div class="customs-upload">
        <el-form inline size="small">
          <el-form-item label="文件类型">
            <el-select v-model="customsType" style="width:140px">
              <el-option label="海关放行单" value="customs_release" />
              <el-option label="关税缴纳凭证" value="tax_certificate" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="文件说明"><el-input v-model="customsLabel" placeholder="可选" style="width:160px" /></el-form-item>
          <el-form-item>
            <el-upload :action="`/api/employee/submissions/${data.id}/customs-docs`" :headers="uploadHeaders" :data="{ file_type: customsType, document_type_label: customsLabel }" :on-success="onUploadSuccess" :before-upload="beforeUpload" :show-file-list="false">
              <el-button type="primary" size="small"><el-icon><Upload /></el-icon> 上传文件</el-button>
            </el-upload>
          </el-form-item>
        </el-form>
        <el-table v-if="customsDocs.length > 0" :data="customsDocs" size="small" stripe style="margin-top:12px">
          <el-table-column prop="document_type_label" label="类型" width="120">
            <template #default="{row}">{{ customsTypeLabel(row.file_type) }}</template>
          </el-table-column>
          <el-table-column prop="file_name" label="文件名" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="100">
            <template #default="{row}">
              <el-link type="primary" :href="`${row.file_path}`" target="_blank">下载</el-link>
              <el-button size="small" text type="danger" @click="delCustomsDoc(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 导出资料给 Next（审核通过或已注册后可见） -->
    <div class="detail-footer" v-if="data.review_status === 'approved' || data.review_status === 'registered'">
      <el-button type="primary" size="large" @click="$router.push(`/employee/submissions/${data.id}/export`)">
        <el-icon><Document /></el-icon> 导出资料给 Next
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { getSubmissionDetail, reviewSubmission, nextRegister, getTimeline } from '@/api/employee'
import { getSubmissionCharges, calculateCharges, checkBalance, markArrived, advanceStatus } from '@/api/finance'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTrackingStatus, getNextStatusLabel } from '@/utils/tracking'
import { CircleCheckFilled, WarningFilled, Clock, Loading } from '@element-plus/icons-vue'
import request from '@/api/request'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const acting = ref(false)
const savingForm = ref(false)
const registering = ref(false)
const activeTab = ref('step1')
const data = reactive({ review_status: 'pending' })

const reviewForm = reactive({ hs_code: '', tax_rate: '', need_form_e: false, need_license: false, license_type: '' })
const nextForm = reactive({ next_account: '', register_status: '', notes: '' })
const licenseDocs = ref([])

// 审核表单自动保存（2秒防抖）
let reviewFormTimer = null
function autoSaveReviewForm() {
  if (reviewFormTimer) clearTimeout(reviewFormTimer)
  reviewFormTimer = setTimeout(async () => {
    try {
      await request.put('/employee/submissions/' + data.id + '/review-form', {
        hs_code: reviewForm.hs_code || null,
        tax_rate: reviewForm.tax_rate || null,
        need_form_e: reviewForm.need_form_e,
        need_license: reviewForm.need_license,
      })
    } catch { /* silent */ }
  }, 2000)
}

// 监听审核表单变化，触发自动保存
watch(reviewForm, () => { if (data.id) autoSaveReviewForm() }, { deep: true })

async function setLicenseType(val) {
  try {
    await request.put('/employee/submissions/' + route.params.id + '/set-license-type', { license_type: val })
    ElMessage.success('许可证类型已设置')
    loadLicenseDocs()
  } catch { ElMessage.error('设置失败') }
}

function onLicenseUploadSuccess() {
  ElMessage.success('上传成功')
  loadLicenseDocs()
}

async function loadLicenseDocs() {
  try {
    const res = await request.get('/employee/submissions/' + route.params.id + '/license-docs')
    licenseDocs.value = res.data || []
  } catch { licenseDocs.value = [] }
}

const step1 = computed(() => data.step1 || {})
const step2 = computed(() => data.step2 || {})
const step3 = computed(() => data.step3 || {})
const step4 = computed(() => data.step4 || {})
const step5 = computed(() => data.step5 || {})

const step2Files = computed(() => [
  { label: 'DBD', file: step2.value.dbd_file },
  { label: 'PP.20', file: step2.value.pp20_file },
  { label: '公司印章', file: step2.value.company_stamp_file },
  { label: '董事护照', file: step2.value.director_passport_file },
])
const step3Files = computed(() => [
  { label: '授权委托书', file: step3.value.power_of_attorney_file },
  { label: 'PP.20签字', file: step3.value.pp20_signed_file },
  { label: 'DBD签字', file: step3.value.dbd_signed_file },
])

const timeline = ref([])
// 分离：体积/重量计费明细 vs 境内运费 vs 仓储费
const domesticNote = computed(() => {
  if (!freightParams.domestic_logistics) return ''
  const notes = {
    bluewhite: 'BlueWhite 蓝白物流 — 费用额外另算',
    flash: 'Flash Express — 费用额外另算',
    kerry: 'Kerry Express — 费用额外另算',
    nim: 'Nim Express — 费用额外另算',
    lalamove: 'Lalamove 包车派送 — 费用额外另算',
    nss: 'NSS 曼谷自提 — 免费 0 ฿',
  }
  return notes[freightParams.domestic_logistics] || (freightParams.domestic_logistics + ' — 费用额外另算')
})

const domesticCharges = computed(() => charges.value.filter(c => c.fee_type === 'domestic_freight'))
const freightCalcCharges = computed(() => charges.value.filter(c => c.fee_type === 'freight_cbm' || c.fee_type === 'freight_kg'))
const maxNoteText = computed(() => {
  const note = charges.value.find(c => c.fee_type === 'freight_max_note')
  return note ? note.fee_name : ''
})
// 国际运费金额（被采纳的那条）
const intlFreightAmount = computed(() => {
  const cbmCharge = charges.value.find(c => c.fee_type === 'freight_cbm')
  const kgCharge = charges.value.find(c => c.fee_type === 'freight_kg')
  if (cbmCharge?.selected) return parseFloat(cbmCharge.amount) || 0
  if (kgCharge?.selected) return parseFloat(kgCharge.amount) || 0
  return 0
})
const storageCharges = computed(() => charges.value.filter(c => c.fee_type === 'storage'))
const storageAmount = computed(() => storageCharges.value.filter(c => c.selected).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0))
const otherTransportCharges = computed(() => charges.value.filter(c => !c.is_optional && c.fee_type !== 'freight_cbm' && c.fee_type !== 'freight_kg' && c.fee_type !== 'freight_max_note'))
const transportCharges = computed(() => charges.value.filter(c => !c.is_optional))
const serviceCharges = computed(() => {
  let list = charges.value.filter(c => c.is_optional)
  // 中国报关费：仅需要退税时显示
  if (!step4.value?.need_rebate) {
    list = list.filter(c => c.fee_type !== 'china_customs')
  }
  // 泰国清关费始终必选，中国报关费(需要退税时)必选
  list.forEach(c => {
    if (c.fee_type === 'thai_customs') c.selected = true
    if (c.fee_type === 'china_customs' && step4.value?.need_rebate) c.selected = true
  })
  return list
})
const transportTotal = computed(() => transportCharges.value.filter(c => c.selected).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0).toFixed(2))
const serviceTotal = computed(() => serviceCharges.value.filter(c => c.selected).reduce((s, c) => s + (parseFloat(c.amount) || 0), 0).toFixed(2))
function recalcTotal() {
  totalAmount.value = (parseFloat(transportTotal.value) + parseFloat(serviceTotal.value)).toFixed(2)
}
const freightParams = reactive({ route: 'nanning_bangkok', domestic_logistics: '', volume: 0, weight: 0, pallet_count: 0, wooden_box_cbm: 0, need_form_e: false, warehouse_entry_date: '' })
const customsDutyForm = reactive({ amount: 0 })
const customsDutySaving = ref(false)
const charges = ref([])
const totalAmount = ref(0)
const chargeLog = ref(null)
const balanceInfo = reactive({ balance: 0, sufficient: true, total_amount: 0 })
const batchNumberForm = reactive({ value: '' })
const batchNumberSaving = ref(false)
async function saveBatchNumber() {
  batchNumberSaving.value = true
  try {
    await request.put('/employee/submissions/' + data.id + '/batch-number', { batch_number: batchNumberForm.value })
    data.batch_number = batchNumberForm.value
    ElMessage.success('批次号已保存')
  } catch { ElMessage.error('保存失败') }
  finally { batchNumberSaving.value = false }
}
const calcLoading = ref(false)
const balanceLoading = ref(false)
const warehouse = ref(null)
// 自动保存
const saveStatus = ref('') // '' | 'saving' | 'saved'
const isDirty = ref(false)
let autoSaveTimer = null

onMounted(async () => { await loadDetail(); loadWarehouse(); loadCustomsDocs(); loadLicenseDocs() })

async function loadWarehouse() {
  try {
    const routeParam = data.international_route || ''
    const res = await request.get('/finance/warehouses', { params: { route: routeParam } })
    warehouse.value = res.data
  } catch { /* */ }
}

// 海关回传文件
const customsType = ref('customs_release')
const customsLabel = ref('')
const customsDocs = ref([])
const uploadHeaders = { Authorization: 'Bearer ' + localStorage.getItem('token') }

function customsTypeLabel(t) { return { customs_release: '海关放行单', tax_certificate: '关税缴纳凭证', other: '其他' }[t] || t }
function beforeUpload(file) {
  const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  if (!allowed.includes(file.type)) { ElMessage.error('不支持的文件类型'); return false }
  if (file.size > 20 * 1024 * 1024) { ElMessage.error('文件大小不能超过20MB'); return false }
  return true
}

async function loadCustomsDocs() {
  try { const r = await request.get(`/employee/submissions/${data.id}/customs-docs`); customsDocs.value = r.data || [] } catch { /* */ }
}
function onUploadSuccess() { ElMessage.success('上传成功'); loadCustomsDocs() }
async function delCustomsDoc(id) {
  try { await request.delete(`/employee/submissions/${data.id}/customs-docs/${id}`); customsDocs.value = customsDocs.value.filter(d => d.id !== id) } catch { /* */ }
}

async function loadDetail() {
  loading.value = true
  try {
    const [res, tl] = await Promise.all([
      getSubmissionDetail(route.params.id),
      getTimeline(route.params.id).catch(() => ({ data: [] })),
    ])
    Object.assign(data, res.data)
    timeline.value = tl.data || []
    // 加载费用数据
    try {
      const fc = await getSubmissionCharges(route.params.id)
      charges.value = fc.data.charges || []
      recalcTotal()
      chargeLog.value = fc.data.charge_log || null
    } catch { /* ignore */ }
    // 回填 Form E
    freightParams.need_form_e = data.step1?.form_e_eligible || false

    customsDutyForm.amount = parseFloat(data.customs_duty_amount) || 0
    // 回填客户预报单数据（优先step5，回退到submissions表字段）
    freightParams.route = data.step5?.route || data.international_route || ''
    freightParams.volume = data.step5?.volume ?? (data.volume || 0)
    freightParams.weight = data.step5?.weight ?? (data.weight || 0)
    freightParams.domestic_logistics = data.step5?.domestic_logistics || data.domestic_logistics || ''
    if (data.step5?.need_form_e !== undefined) freightParams.need_form_e = data.step5.need_form_e
    if (data.step5?.pallet_count !== undefined) freightParams.pallet_count = data.step5.pallet_count
    if (data.step5?.wooden_box_cbm !== undefined) freightParams.wooden_box_cbm = parseFloat(data.step5.wooden_box_cbm) || 0

    // 回填已有的确认信息
    if (step1.value) {
      reviewForm.hs_code = step1.value.hs_code || ''
      reviewForm.tax_rate = step1.value.tariff_rate || ''
      reviewForm.need_form_e = step1.value.form_e_eligible || false
      reviewForm.need_license = step1.value.license_required || false
      reviewForm.license_type = data.license_type || step1.value.license_type || ''
    }
    nextForm.next_account = data.next_account || ''
    batchNumberForm.value = data.batch_number || ''
    nextForm.register_status = data.next_register_status || ''
  } catch { router.push('/employee/review') }
  finally { loading.value = false }
  loadLicenseDocs()
}

function imgUrl(img) {
  if (!img) return ''
  return img.url || img.stored_path || ''
}

function fileUrl(file) {
  if (!file) return ''
  return file.url || file.stored_path || ''
}

function openFile(file) {
  const url = fileUrl(file)
  if (url) window.open(url, '_blank')
}

async function handleSaveReviewForm() {
  if (!data.id) return
  savingForm.value = true
  try {
    await request.put('/employee/submissions/' + data.id + '/review-form', {
      hs_code: reviewForm.hs_code || null,
      tax_rate: reviewForm.tax_rate || null,
      need_form_e: reviewForm.need_form_e,
      need_license: reviewForm.need_license,
    })
    // Also save license_type via existing API
    if (reviewForm.license_type) {
      await request.put('/employee/submissions/' + data.id + '/set-license-type', { license_type: reviewForm.license_type }).catch(() => {})
    }
    ElMessage.success('审核信息已保存')
  } catch { ElMessage.error('保存失败') }
  finally { savingForm.value = false }
}

async function handleReview(action) {
  if (action === 'reject') {
    try {
      const { value } = await ElMessageBox.prompt('请填写退回原因', '退回客户补件', {
        confirmButtonText: '确认退回',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (v) => v && v.trim() ? true : '必须填写退回原因',
        inputErrorMessage: '退回原因不能为空',
      })
      await doReview(action, value)
    } catch { return }
  } else {
    try {
      await ElMessageBox.confirm('确认审核通过？通过后进入待注册状态。', '审核确认', {
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        type: 'success',
      })
    } catch { return }
    await doReview(action, null)
  }
}

async function doReview(action, comment) {
  acting.value = true
  try {
    await reviewSubmission(data.id, {
      action,
      comment,
      hs_code: reviewForm.hs_code || null,
      tax_rate: reviewForm.tax_rate || null,
      need_form_e: reviewForm.need_form_e,
      need_license: reviewForm.need_license,
    })
    ElMessage.success(action === 'approve' ? '审核通过' : '已退回')
    await loadDetail()
  } catch { /* handled */ }
  finally { acting.value = false }
}

async function handleNextRegister() {
  if (!nextForm.next_account) {
    ElMessage.warning('请填写 Next 注册账号')
    return
  }
  registering.value = true
  try {
    await nextRegister(data.id, { ...nextForm })
    ElMessage.success('注册结果已保存')
    await loadDetail()
  } catch { /* handled */ }
  finally { registering.value = false }
}

async function saveCustomsDuty() {
  if (!data.id) return
  customsDutySaving.value = true
  try {
    await request.put('/finance/employee/submissions/' + data.id + '/customs-duty', { amount: customsDutyForm.amount })
    ElMessage.success('海关关税已保存')
  } catch { ElMessage.error('保存失败') }
  finally { customsDutySaving.value = false }
}

async function handleCalculate() {
  calcLoading.value = true
  try { const res = await calculateCharges(data.id, { ...freightParams }); charges.value = res.data.charges; recalcTotal(); activeTab.value = 'finance'; isDirty.value = false; saveStatus.value = 'saved' }
  catch { /* handled */ }
  finally { calcLoading.value = false }
}

// 自动保存：监听参数变化，2秒防抖后自动计算并保存
watch(
  () => ({ ...freightParams }),
  () => {
    if (!data.id) return
    isDirty.value = true
    saveStatus.value = 'saving'
    clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(() => doAutoSave(), 2000)
  },
  { deep: true }
)

// 附加服务切换时也触发自动保存
function recalcTotalWithSave() {
  recalcTotal()
  isDirty.value = true
  saveStatus.value = 'saving'
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => doAutoSave(), 2000)
}

async function doAutoSave() {
  if (!data.id) return
  try {
    const res = await calculateCharges(data.id, { ...freightParams })
    // 保留附加服务的勾选状态
    const svcMap = {}
    charges.value.filter(c => c.is_optional).forEach(c => { svcMap[c.fee_type] = c.selected })
    charges.value = res.data.charges
    charges.value.filter(c => c.is_optional).forEach(c => { if (svcMap[c.fee_type] !== undefined) c.selected = svcMap[c.fee_type] })
    recalcTotal()
    isDirty.value = false
    saveStatus.value = 'saved'
  } catch { saveStatus.value = '' }
}

// 离开提醒
onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value) {
    ElMessageBox.confirm('费用数据尚未保存，确定离开吗？', '未保存的修改', { confirmButtonText: '离开', cancelButtonText: '继续编辑', type: 'warning' })
      .then(() => { isDirty.value = false; next() })
      .catch(() => next(false))
  } else {
    next()
  }
})

async function handleCheckBalance() {
  balanceLoading.value = true
  try { const res = await checkBalance(data.id); Object.assign(balanceInfo, res.data) }
  catch { /* handled */ }
  finally { balanceLoading.value = false }
}

// 订单状态推进
const advancing = ref(false)
const currentStatus = computed(() => getTrackingStatus(data.tracking_status))
const nextTrackingStatus = computed(() => {
  const ts = data.tracking_status || 1
  return ts < 11 ? ts + 1 : null
})
const nextStatusLabel = computed(() => getNextStatusLabel(data.tracking_status))
const canAdvance = computed(() => {
  const ts = data.tracking_status || 1
  return ts >= 2 && ts < 9
})

async function handleAdvanceStatus() {
  const next = nextTrackingStatus.value
  if (!next) return

  // 状态9需确认扣款
  if (next === 7) {
    try {
      await ElMessageBox.confirm(
        '推进到「已到泰国仓库」将自动从客户余额扣款。请确保费用已确认且客户余额充足。',
        '确认到仓并扣款',
        { confirmButtonText: '确认推进并扣款', cancelButtonText: '取消', type: 'warning' }
      )
    } catch { return }
  }

  advancing.value = true
  try {
    await advanceStatus(data.id)
    ElMessage.success(`状态已推进: ${currentStatus.value.label} → ${nextStatusLabel.value}`)
    await loadDetail()
  } catch (err) {
    const msg = err?.response?.data?.message || '操作失败'
    ElMessage.error(msg)
  }
  finally { advancing.value = false }
}

const arriving = ref(false)
async function handleMarkArrived() {
  try {
    await ElMessageBox.confirm('确认货物已到达泰国仓库？点击确认后将自动扣除客户余额', '确认到仓', { confirmButtonText: '确认到仓并扣款', cancelButtonText: '取消', type: 'warning' })
  } catch { return }
  arriving.value = true
  try {
    await markArrived(data.id)
    ElMessage.success('已标记到仓并完成扣款')
    await loadDetail()
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '操作失败')
  }
  finally { arriving.value = false }
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

function statusTag(s) {
  return s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : s === 'registered' ? '' : 'warning'
}

function statusLabel(s) {
  return s === 'approved' ? '待注册' : s === 'rejected' ? '已退回' : s === 'registered' ? '已注册' : '待审核'
}
</script>

<style lang="scss" scoped>
.review-detail { max-width: 1000px; margin: 0 auto; }
.detail-header {
  display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;
  .header-info {
    h2 { margin: 0 0 4px; font-size: 20px; }
    .header-meta { display: block; color: #909399; font-size: 13px; margin-top: 4px; }
    .el-tag { margin-left: 10px; }
  }
}
.tab-content {
  h4 { margin: 0 0 12px; color: #303133; }
}
.file-card {
  text-align: center;
  .file-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
  .file-ok { color: #67C23A; font-size: 12px; display: flex; align-items: center; gap: 4px; justify-content: center; }
  .file-none { color: #c0c4cc; font-size: 12px; }
  &.clickable { cursor: pointer; transition: all 0.2s; &:hover { border-color: #409EFF; box-shadow: 0 2px 8px rgba(64,158,255,.2); } }
}
.next-section {
  margin-top: 20px;
  .registered-info { color: #606266; font-size: 14px; display: flex; align-items: center; gap: 10px; }
}
.detail-footer {
  display: flex; justify-content: center; gap: 20px; margin-top: 24px; padding-bottom: 40px;
}
/* 订单状态追踪 */
.status-card { margin-top: 20px; }
.status-section { display: flex; flex-direction: column; gap: 12px; }
.status-current { display: flex; align-items: center; gap: 12px; }
.status-label { font-size: 15px; color: #606266; font-weight: 600; }
.status-time { font-size: 13px; color: #909399; }
.status-next { display: flex; align-items: center; gap: 16px; }
.next-hint { font-size: 15px; color: #606266; strong { color: #409EFF; } }
.status-end { display: flex; align-items: center; gap: 8px; font-size: 16px; color: #67C23A; }
/* 费用汇总 */
.summary-section {
  margin-top: 20px; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,.06);
  h4 { margin: 0 0 16px; color: #303133; }
}
.summary-rows { max-width: 500px; }
.summary-row {
  display: flex; justify-content: space-between; align-items: center; padding: 8px 0;
  span:first-child { font-size: 15px; color: #606266; }
  span:last-child { font-size: 17px; font-weight: 600; color: #303133; }
}
.summary-row-total {
  span:first-child { font-size: 18px; font-weight: 700; color: #303133; }
  span:last-child { font-size: 24px; font-weight: 700; color: #409EFF; }
}
/* 付款状态 */
.pay-block { display: flex; align-items: center; gap: 20px; padding: 22px 24px; border-radius: 10px; }
.pay-done { background: linear-gradient(135deg, #67C23A, #85CE61); }
.pay-refund { background: linear-gradient(135deg, #E6A23C, #EBB563); }
.pay-pending { background: linear-gradient(135deg, #909399, #B0B3BB); }
.pay-icon-wrap { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pay-text { color: #fff; }
.pay-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.pay-amount { font-size: 22px; font-weight: 700; margin-bottom: 2px; }
.pay-time { font-size: 13px; opacity: .85; }
</style>
