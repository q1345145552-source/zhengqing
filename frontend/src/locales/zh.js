export default {
  common: { save:'保存', cancel:'取消', submit:'提交', search:'搜索', back:'返回', confirm:'确认', delete:'删除', edit:'编辑', view:'查看', close:'关闭', yes:'是', no:'否', loading:'加载中...', noData:'暂无数据', total:'共', page:'页', items:'条', all:'全部', filter:'筛选', reset:'重置', add:'新增', remove:'移除', enable:'启用', disable:'停用', upload:'上传', download:'下载', preview:'预览', logout:'退出登录', profile:'个人信息', settings:'设置', tip:'提示', success:'操作成功', fail:'操作失败', required:'必填', optional:'选填', detail:'详情', list:'列表', action:'操作', status:'状态', time:'时间', name:'名称', description:'说明', note:'备注', home:'首页', ok:'确定' },
  nav: { home:'首页', dashboard:'工作台', profile:'我的资料', applications:'我的申请', tracking:'货物追踪', wallet:'我的钱包', prices:'价格查询', orders:'我的订单', upload:'资料上传', review:'客户申请', reviewHistory:'审核记录', pendingCharge:'待扣款确认', feeEstimate:'费用预估', adminHome:'管理后台首页', allSubmissions:'所有申请', employees:'员工管理', customers:'客户管理', priceRules:'价格规则', sysSettings:'系统配置', exportData:'导出资料给 Next', notifications:'通知' },
  status: { pendingReview:'待审核', approved:'审核通过', warehouseReceiving:'中国仓库收货', inTransit:'运输中', inCustoms:'清关中', released:'已放行', arrivedThailand:'已到泰国仓库', outForDelivery:'已派送', completed:'已完成', rejected:'已退回', draft:'草稿', registered:'已注册' },
  payment: { amount:'金额', balance:'余额', chargeTime:'扣款时间', autoDeduct:'到达泰国仓库时自动扣款', confirmCharge:'确认扣款', totalPayable:'应付金额', chargeSuccess:'扣款成功', refunded:'已退款' },
  order: { orderNo:'申请编号', company:'公司', product:'产品', tariff:'关税', freight:'运费', updatedAt:'更新于', completedAt:'完成于', submittedAt:'提交于', clientName:'客户', clientEmail:'邮箱', reviewStatus:'审核状态', chargeStatus:'费用状态' },
  fee: { intlFreight:'国际运费', domesticFreight:'境内运费', storageFee:'仓储费', addonServices:'附加服务', totalCost:'费用总计', byVolume:'按体积', byWeight:'按重量', takeHigher:'取较大值', route:'路线', volume:'体积(CBM)', weight:'重量(KG)', logistics:'境内物流', warehouseDate:'入仓日期', palletCount:'托盘数', woodenBox:'木箱CBM', needFormE:'需要 Form E', calculate:'计算费用', estimate:'费用预估', estimateTitle:'独立运费计算工具', estimateDesc:'不关联具体申请，适合电话报价或快速查询', autoSaved:'已保存', saving:'保存中' },
  route: { nanning:'南宁→曼谷', guangzhou:'广州深圳→曼谷', yiwu:'义乌→曼谷', nanningShort:'南宁', guangzhouShort:'广州深圳', yiwuShort:'义乌' },
  warehouse: { title:'收货仓库地址', shipHere:'请自行发货至以下地址', contact:'联系人', phone:'电话', name:'仓库名称', address:'地址' },
  product: { info:'产品信息', thaiName:'产品泰文名', engName:'产品英文名', hsCode:'HS Code', tariffRate:'关税税率', formE:'Form E', license:'许可证', description:'产品描述', images:'产品图片', reviewConfirm:'员工审核确认', available:'可用', unavailable:'不可用', required2:'需要', notRequired:'不需要' },
  company: { info:'公司信息', name:'公司名称', thaiAddress:'泰国地址', files:'公司文件', dbd:'DBD 文件', pp20:'PP.20 文件', stamp:'公司印章', passport:'法人护照' },
  customs: { info:'报关授权', type:'授权类型', director:'董事本人办理', agent:'委托办理', account:'报关账号', password:'报关密码', hasPassport:'护照原件', provided:'已提供', notConfirmed:'未确认', agentFiles:'委托文件', poaFile:'授权委托书', pp20Signed:'PP.20 签字', dbdSigned:'DBD 签字' },
  tax: { info:'退税信息', type2:'退税方案', needRebate:'需要退税', noRebate:'无需退税（货代）', customsCompany:'报关公司', logisticsContact:'物流对接人', logisticsCode:'物流编码', invoice:'商业发票', packingList:'装箱单' },
  shipment: { info:'发货信息', confirmed:'确认发货', trackingNo:'运单号', shippedAt:'发货时间', arrivedAt:'到仓时间', statusConfirmed:'已确认', statusPending:'待确认' },
  review: { pending:'待审核', approved2:'审核通过', registered:'已注册', rejected:'已退回', approve:'审核通过', reject:'退回', rejectReason:'退回原因', nextAccount:'Next 账号', registerStatus:'注册状态', registerSuccess:'注册成功', registerFailed:'注册失败', registering:'注册中', saveRegister:'保存注册结果', registered2:'已注册', timeline:'操作轨迹', noRecord:'暂无操作记录' },
  button: { viewDetail:'查看详情', advance:'推进至', approve2:'审核通过', reject2:'退回', calculate2:'计算费用', recharge:'充值', deposit:'充值', exportNext:'导出资料给 Next', confirmCharge2:'确认扣款', markArrived:'确认到仓并扣款', checkBalance:'检查余额', balanceSufficient:'充足', balanceInsufficient:'不足' },
  // 客户端页面
  client: {
    dashboard: { welcome:'欢迎回来', roleLabel:'您当前登录为', allApps:'全部申请', pendingReview2:'审核中', approved2:'已通过', rejected2:'已退回' },
    upload: { title:'资料上传', stepLabel:'第 X/Y 步', step1:'产品确认', step1Desc:'确认产品进口信息', step2:'公司资料', step2Desc:'上传公司证明文件', step3:'报关授权', step3Desc:'海关报关代理登记', step4:'出口退税', step4Desc:'确认退税申报方式', prev:'上一步', next:'下一步', saveDraft:'保存草稿', submitData:'提交资料', submitConfirm:'提交后资料将交由员工审核，确认提交？', submitOk:'确认提交', submitCancel:'再检查一下', submitSuccess:'资料提交成功！我们会尽快处理' },
    submissions: { title:'我的申请', filterAll:'全部', filterPending:'审核中', filterApproved:'已通过', filterRegistered:'已注册', filterRejected:'已退回', empty:'暂无申请记录', goUpload:'去提交申请', detailTitle:'申请详情', resubmit:'重新提交' },
    tracking: { title:'货物追踪', empty:'暂无货物追踪记录' },
    orders: { title:'我的订单', desc:'已完成的历史订单', empty:'暂无已完成订单' },
    wallet: { title:'我的钱包', balance:'当前余额', deposit2:'在线充值', amount2:'充值金额', history:'交易记录' },
    prices: { title:'价格查询', tabPrices:'价格表', tabEstimate:'费用预估', transport:'运输价格（泰铢）', addonTitle:'附加服务价格', estimateDesc2:'输入体积和重量，选择路线，计算国际运费（仅供参考，以员工核算为准）', freightResult:'预估运费', footnote:'以上价格如有调整以最新为准，预估结果仅供参考，实际费用以员工核算为准。' },
    notifications: { title:'消息通知' },
    orderDetail: { title:'订单详情' },
    trackingDetail: { title:'订单总览' }
  },
  // 员工端页面
  employee: {
    dashboard: { title:'工作台', pendingReview2:'待审核', toRegister:'待注册' },
    review: { title:'客户申请', filterAll:'全部', filterPending2:'审核中', filterApproved:'已通过', filterRegistered:'已注册', filterRejected2:'已退回', empty:'暂无申请记录', goDetail:'查看详情', goReview:'审核', registerEntry:'录入注册', statusTag:'审核状态', productTag:'产品' },
    reviewDetail: { title:'审核详情', back:'返回列表', tabProduct:'产品信息', tabCompany:'公司资料', tabCustoms:'报关授权', tabTax:'退税信息', tabShipment:'发货信息', tabFinance:'费用明细', feeParams:'计费参数', intlRoute:'国际路线', domesticLogistics:'境内物流', transportTitle:'国际运费明细（按体积与重量择大计费）', domesticTitle:'境内运费', storageTitle:'仓储费', addonTitle2:'附加服务（手动勾选）', addonTotal2:'附加服务合计', summaryTitle:'费用汇总', totalReceivable:'总应收', clientBalance:'客户余额', charged:'已扣款', refunded2:'已退款', pendingCharge2:'待扣款', trackStatus:'订单状态追踪', currentStatus:'当前状态', nextStatus:'下一步', advanceTo:'推进至', completedAll:'订单已完成全部流程', arrivedWarning:'推进到「已到泰国仓库」将自动从客户余额扣款，请确保费用已确认且客户余额充足。' },
    tracking2: { title:'货物追踪', empty:'暂无追踪记录', filterStatus:'按状态筛选' },
    pendingCharge: { title:'待扣款确认', desc:'以下订单在推进到「已到泰国仓库」时扣款失败，等待客户充值后手动确认扣款', empty:'暂无待扣款申请', confirmButton:'确认扣款', confirmMsg:'确认从客户余额扣除' },
    feeEstimate: { title:'费用预估', desc:'独立运费计算工具，不关联具体申请，适合电话报价或快速查询', params:'计费参数', result:'计算结果（泰铢）', intlFreight2:'国际运费', domesticFreight2:'境内运费', storageFee2:'仓储费', addonTotal2:'附加服务', quickNote:'快速备注', notePlaceholder:'客户名称/备注（不保存，仅参考）' },
    export: { title:'资料导出汇总', back:'返回', basicInfo:'基本信息', section1:'一、产品信息', section2:'二、公司资料', section3:'三、报关授权', section4:'四、退税信息', section5:'五、发货信息', section6:'六、费用信息', section7:'七、Next注册信息', allFiles:'全部文件', notUploaded:'未上传', fileDownload:'下载/预览', feeDetail2:'国际运费', domesticFreight3:'境内运费', storageFee3:'仓储费', addonServices3:'附加服务', chargeStatus2:'状态', selected:'已选', notSelected:'未选', totalFee:'总费用' }
  },
  // 管理员端页面
  admin: {
    dashboard: { title:'管理后台首页', overview:'概览', totalClients:'总客户数', newClientsMonth:'本月新增客户', ordersMonth:'本月订单数', revenueMonth:'本月总收入', orderDist:'订单状态分布', routeDist:'路线分布', financeOverview:'财务概览（本月）', depositTotal:'充值总额', chargeTotal:'扣费总额', totalBalance2:'客户总余额', recentOrders:'近期订单' },
    submissions: { title:'所有申请', empty:'暂无申请记录' },
    tracking: { title:'货物追踪', empty:'暂无追踪记录' },
    priceRules: { title:'价格规则管理', addService:'新增服务', feeName:'服务名称', unitPrice:'单价(฿)', unit:'单位', route2:'路线', isActive:'状态', addDialog:'新增价格规则', serviceName:'服务名称', code:'识别码', description2:'说明', addSuccess:'新增成功', delConfirm:'确定删除？删除后不可恢复。', delSuccess:'已删除', updateSuccess:'已更新', unitFixed:'每单', unitCbm:'每m³', unitKg:'每kg', unitPallet:'每托', routeGeneric:'通用' },
    employees: { title:'员工管理', create:'创建员工', username:'用户名', email:'邮箱', role:'角色', status2:'状态', createdAt:'创建时间', generatedPwd:'生成密码', noData:'暂无员工' },
    customers: { title:'客户管理', submissions2:'申请记录', transactions:'交易记录' },
    settings: { title:'系统配置' }
  },
  // 登录页
  login: { title:'正清系统', subtitle:'物流清关管理平台', username2:'用户名', password2:'密码', loginBtn:'登录', rememberMe:'记住密码', forgotPassword:'忘记密码', loginFailed:'登录失败' },
  // 错误页
  error: { forbidden:'无权限', forbiddenDesc:'抱歉，您没有权限访问此页面', notFound:'页面不存在', notFoundDesc:'抱歉，您访问的页面不存在', backHome:'返回首页' }
}
