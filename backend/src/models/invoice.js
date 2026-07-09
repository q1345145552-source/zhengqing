const PDFDocument = require('pdfkit');
const path = require('path');
const { query } = require('../db');
const EmployeeReview = require('./employeeReview');

// 字体文件路径（系统安装的 Noto 字体）
const FONT_SC = path.join(__dirname, '../../fonts/NotoSansSC-Regular.ttf');
const FONT_TH = '/usr/share/fonts/noto/NotoSansThaiLooped-Regular.ttf';

const translations = {
  zh: {
    title: '湘泰出海',
    subtitle: '发票 / INVOICE',
    orderNo: '申请编号',
    date: '日期',
    client: '客户',
    company: '公司名称',
    route: '路线',
    costBreakdown: '费用明细',
    item: '项目',
    amount: '金额',
    total: '总计',
    chargeTime: '扣款时间',
    chargeAmount: '扣款金额',
    bankInfo: '收款账户',
    bankName: '开户行：中国银行',
    accountNo: '账号：6217 0000 0000 0000 000',
    remark: '备注',
    remarkText: '本发票为电子发票，与纸质发票具有同等法律效力',
    routes: { nanning_bangkok: '南宁 → 曼谷', guangzhou_bangkok: '广州深圳 → 曼谷', yiwu_bangkok: '义乌 → 曼谷' },
  },
  th: {
    title: 'เซียงไท่ ชูไห่',
    subtitle: 'ใบแจ้งหนี้ / INVOICE',
    orderNo: 'เลขที่ใบสมัคร',
    date: 'วันที่',
    client: 'ลูกค้า',
    company: 'ชื่อบริษัท',
    route: 'เส้นทาง',
    costBreakdown: 'รายละเอียดค่าธรรมเนียม',
    item: 'รายการ',
    amount: 'จำนวนเงิน',
    total: 'รวมทั้งสิ้น',
    chargeTime: 'เวลาหักเงิน',
    chargeAmount: 'จำนวนเงินที่หัก',
    bankInfo: 'บัญชีรับเงิน',
    bankName: 'ธนาคาร：Bank of China',
    accountNo: 'เลขที่บัญชี：6217 0000 0000 0000 000',
    remark: 'หมายเหตุ',
    remarkText: 'ใบแจ้งหนี้นี้เป็นใบแจ้งหนี้อิเล็กทรอนิกส์ มีผลทางกฎหมายเทียบเท่าใบแจ้งหนี้กระดาษ',
    routes: { nanning_bangkok: 'หนานหนิง → กรุงเทพ', guangzhou_bangkok: 'กวางโจว/เซินเจิ้น → กรุงเทพ', yiwu_bangkok: 'อี้อู → กรุงเทพ' },
  },
};

async function generateInvoice(submissionId, lang = 'zh') {
  const t = translations[lang] || translations.zh;
  const fontFile = lang === 'th' ? FONT_TH : FONT_SC;
  const data = await EmployeeReview.exportData(submissionId);
  if (!data) throw new Error('订单不存在');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    // 注册嵌入字体
    doc.registerFont('CJK', fontFile);
    const font = 'CJK';
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width - 80;
    // font is registered above

    // === Header ===
    doc.fontSize(26).font(font).text(t.title, { align: 'center' });
    doc.fontSize(14).fillColor('#409EFF').text(t.subtitle, { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#000');

    // divider
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#409EFF');
    doc.moveDown(0.8);

    // Order info
    doc.fontSize(11);
    const routeName = t.routes[data.international_route] || data.international_route || '-';
    const companyName = data.step2?.company_name || data.client_name || '-';
    
    const leftX = 40;
    doc.text(`${t.orderNo}：${data.application_no || '#' + data.id}`, leftX);
    doc.text(`${t.date}：${fmtDate(new Date())}`, leftX + 260);
    doc.text(`${t.client}：${data.client_name || '-'}`, leftX);
    doc.text(`${t.route}：${routeName}`, leftX + 260);
    doc.text(`${t.company}：${companyName}`, leftX);
    doc.moveDown(0.8);

    // === Cost Breakdown Table ===
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#ddd');
    doc.moveDown(0.5);
    doc.fontSize(13).fillColor('#333').text(t.costBreakdown, { underline: true });
    doc.moveDown(0.3);
    doc.fillColor('#000').fontSize(10);

    // Table header
    const col1X = 50, col2X = 400, lineY = doc.y;
    doc.font(font).fillColor('#606266').text(t.item, col1X, lineY);
    doc.text(t.amount, col2X, lineY);
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#eee');
    doc.moveDown(0.3);

    // Cost rows
    doc.fillColor('#000');
    const finance = data.finance || {};
    
    function addRow(label, amt, isBold) {
      const y = doc.y;
      if (isBold) doc.font(font);
      else doc.font(font);
      doc.text(label, col1X, y);
      doc.text(`${(amt || 0).toLocaleString()} ฿`, col2X, y, { align: 'right', width: 100 });
      doc.moveDown(0.15);
    }

    // Freight
    if (finance.freight_cbm?.selected && finance.freight_cbm.amount > 0) {
      addRow(finance.freight_cbm.fee_name || t.item, finance.freight_cbm.amount);
    }
    if (finance.freight_kg?.selected && finance.freight_kg.amount > 0) {
      addRow(finance.freight_kg.fee_name || t.item, finance.freight_kg.amount);
    }

    // Services
    (finance.services || []).filter(s => s.selected && s.amount > 0).forEach(s => {
      addRow(s.fee_name, s.amount);
    });

    // Customs duty
    if ((data.customs_duty_amount || 0) > 0) {
      addRow(lang === 'zh' ? '海关关税（代垫）' : 'ภาษีศุลกากร', data.customs_duty_amount);
    }

    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#409EFF');
    doc.moveDown(0.3);

    // Total
    doc.fontSize(14).fillColor('#E6A23C');
    doc.text(`${t.total}：${finance.total_amount.toLocaleString()} ฿`, { align: 'right' });
    doc.fillColor('#000').fontSize(10);
    doc.moveDown(0.8);

    // Charge info
    if (finance.charge_log?.status === 'charged') {
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#ddd');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#333');
      doc.text(`${t.chargeTime}：${fmtDate(new Date(finance.charge_log.charged_at))}`, leftX);
      doc.text(`${t.chargeAmount}：${parseFloat(finance.charge_log.total_amount).toLocaleString()} ฿`, leftX);
    }

    // Bank info
    doc.moveDown(1.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#ddd');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333');
    doc.text(`${t.bankInfo}：`, leftX);
    doc.text(t.bankName, leftX + 15);
    doc.text(t.accountNo, leftX + 15);

    // Remark
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#999');
    doc.text(t.remarkText, { align: 'center' });

    doc.end();
  });
}

function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

module.exports = { generateInvoice };
