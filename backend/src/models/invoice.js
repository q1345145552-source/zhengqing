const PDFDocument = require('pdfkit');
const path = require('path');
const { query } = require('../db');
const EmployeeReview = require('./employeeReview');

// 字体文件路径
const FONT_SC = path.join(__dirname, '../../fonts/NotoSansSC-Regular.ttf');
const FONT_TH = path.join(__dirname, '../../fonts/Sarabun-Regular.ttf');

const translations = {
  zh: {
    title: '湘泰出海',
    subtitle: '发票 / INVOICE',
    orderNo: '申请编号',
    date: '日期',
    client: '客户',
    company: '公司名称',
    taxId: '公司税号',
    address: '公司地址',
    route: '路线',
    costBreakdown: '费用明细',
    item: '项目',
    amount: '金额',
    subtotal: '费用总计',
    vat: '增值税 VAT 7%',
    grandTotal: '含税总计',
    bankInfo: '收款账户',
    bankName: '开户行：中国银行',
    accountNo: '账号：6217 0000 0000 0000 000',
    billFrom: '开票方',
    billCompany: 'Double H Cargo Thailand Co., Ltd.',
    billTaxId: '税号：0105555123456',
    billAddress: '地址：曼谷市然那哇区',
    billPhone: '电话：02-000-0000',
    remark: '备注',
    remarkText: '本发票为电子发票，与纸质发票具有同等法律效力',
    currency: '泰铢',
    customsDuty: '海关关税',
    routes: { nanning_bangkok: '南宁 → 曼谷', guangzhou_bangkok: '广州深圳 → 曼谷', yiwu_bangkok: '义乌 → 曼谷' },
  },
  th: {
    title: 'เซียงไท่ ชูไห่',
    subtitle: 'ใบแจ้งหนี้ / INVOICE',
    orderNo: 'เลขที่ใบสมัคร',
    date: 'วันที่',
    client: 'ลูกค้า',
    company: 'ชื่อบริษัท',
    taxId: 'TAX ID',
    address: 'ที่อยู่บริษัท',
    route: 'เส้นทาง',
    costBreakdown: 'รายละเอียดค่าธรรมเนียม',
    item: 'รายการ',
    amount: 'จำนวนเงิน',
    subtotal: 'รวมค่าธรรมเนียม',
    vat: 'ภาษีมูลค่าเพิ่ม 7%',
    grandTotal: 'รวมทั้งสิ้น (รวมภาษี)',
    bankInfo: 'บัญชีรับเงิน',
    bankName: 'ธนาคาร：Bank of China',
    accountNo: 'เลขที่บัญชี：6217 0000 0000 0000 000',
    billFrom: 'ผู้เรียกเก็บ',
    billCompany: 'Double H Cargo Thailand Co., Ltd.',
    billTaxId: 'TAX ID：0105555123456',
    billAddress: 'ที่อยู่：กรุงเทพฯ เขตยานนาวา',
    billPhone: 'โทร：02-000-0000',
    remark: 'หมายเหตุ',
    remarkText: 'ใบแจ้งหนี้นี้เป็นใบแจ้งหนี้อิเล็กทรอนิกส์ มีผลทางกฎหมายเทียบเท่าใบแจ้งหนี้กระดาษ',
    currency: 'บาท',
    customsDuty: 'ค่าภาษีศุลกากร',
    routes: { nanning_bangkok: 'หนานหนิง ไปยัง กรุงเทพ', guangzhou_bangkok: 'กวางโจว/เซินเจิ้น ไปยัง กรุงเทพ', yiwu_bangkok: 'อี้อู ไปยัง กรุงเทพ' },
    feeNames: {
      freight_cbm: 'ค่าขนส่งระหว่างประเทศ (ตามปริมาตร)',
      freight_kg: 'ค่าขนส่งระหว่างประเทศ (ตามน้ำหนัก)',
      domestic_freight: 'ค่าขนส่งภายในประเทศ',
      thai_customs: 'ค่าบริการพิธีการศุลกากร',
      china_customs: 'ค่าธรรมเนียมศุลกากรจีน',
      form_e: 'ค่าธรรมเนียม Form E',
      pallet: 'ค่าธรรมเนียมพาเลท',
      wooden_box: 'ค่าธรรมเนียมบรรจุภัณฑ์ไม้',
      storage: 'ค่าจัดเก็บสินค้า',
    },
  },
};

async function generateInvoice(submissionId, lang = 'zh') {
  const t = translations[lang] || translations.zh;
  const fontFile = lang === 'th' ? FONT_TH : FONT_SC;
  const data = await EmployeeReview.exportData(submissionId);

  // 泰文发票翻译费用名称
  function feeLabel(c) {
    if (lang === 'th' && t.feeNames && c.fee_type) {
      return t.feeNames[c.fee_type] || c.fee_name;
    }
    return c.fee_name;
  }
  // Sarabun 字体不支持全角冒号，泰文下替换为半角
  function tStr(str) {
    return lang === 'th' ? String(str).replace(/：/g, ':') : String(str);
  }
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

    // === Header ===
    doc.fontSize(26).font(font).text(t.title, { align: 'center' });
    doc.fontSize(14).fillColor('#409EFF').text(t.subtitle, { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#000');

    // divider
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#409EFF');
    doc.moveDown(0.8);

    // === Customer Info (from submission_company_docs) ===
    doc.fontSize(11);
    const routeName = t.routes[data.international_route] || data.international_route || '-';
    const companyName = data.step2?.company_name || data.client_name || '-';
    const companyAddress = data.step2?.thai_address || '';
    const companyTaxId = data.step2?.tax_id || '';
    
    const leftX = 40;
    doc.text(`${tStr(t.orderNo)} ${data.application_no || '#' + data.id}`, leftX);
    doc.text(`${tStr(t.date)} ${fmtDate(new Date())}`, leftX + 260);
    doc.text(`${tStr(t.client)} ${data.client_name || '-'}`, leftX);
    doc.text(`${tStr(t.route)} ${routeName}`, leftX + 260);
    doc.text(`${tStr(t.company)} ${companyName}`, leftX);
    if (companyTaxId) doc.text(`${tStr(t.taxId)} ${companyTaxId}`, leftX);
    if (companyAddress) doc.text(`${tStr(t.address)} ${companyAddress}`, leftX);
    doc.moveDown(0.3);

    // === Billing Party (Double H Cargo) ===
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#ddd');
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#333').text(t.billFrom, leftX);
    doc.moveDown(0.2);
    doc.fillColor('#000').fontSize(10);
    doc.text(t.billCompany, leftX);
    doc.text(t.billTaxId, leftX);
    doc.text(t.billAddress, leftX);
    doc.text(t.billPhone, leftX);
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

    // Cost rows — only show selected=true
    doc.fillColor('#000');
    const finance = data.finance || {};
    
    function addRow(label, amt, isBold) {
      const y = doc.y;
      doc.font(font);
      // 中文模式下替换 ฿ 为泰铢，泰文模式下替换全角冒号
      let safeLabel = label;
      if (lang === 'zh') safeLabel = String(label).replace(/฿/g, '泰铢');
      else if (lang === 'th') safeLabel = String(label).replace(/：/g, ':');
      doc.text(safeLabel + '', col1X, y);
      doc.text(`${(amt || 0).toLocaleString()} ${t.currency}`, col2X, y, { align: 'right', width: 100 });
      doc.moveDown(0.15);
    }

    // Freight (selected=true only)
    if (finance.freight_cbm?.selected && (finance.freight_cbm.amount || 0) > 0) {
      addRow(feeLabel(finance.freight_cbm) || t.item, finance.freight_cbm.amount);
    }
    if (finance.freight_kg?.selected && (finance.freight_kg.amount || 0) > 0) {
      addRow(feeLabel(finance.freight_kg) || t.item, finance.freight_kg.amount);
    }

    // Services (selected=true only)
    (finance.services || []).filter(s => s.selected && (s.amount || 0) > 0).forEach(s => {
      addRow(feeLabel(s), s.amount);
    });

    // Customs duty
    if ((data.customs_duty_amount || 0) > 0) {
      addRow(t.customsDuty, data.customs_duty_amount);
    }

    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#409EFF');
    doc.moveDown(0.3);

    // === Subtotal ===
    const subtotal = finance.total_amount || 0;
    doc.fontSize(14).fillColor('#E6A23C');
    doc.text(`${tStr(t.subtotal)} ${subtotal.toLocaleString()} ${t.currency}`, { align: 'right' });
    doc.fillColor('#000').fontSize(10);

    // === VAT 7% ===
    const vatAmount = Math.round(subtotal * 0.07);
    doc.fontSize(12).fillColor('#666');
    doc.text(`${tStr(t.vat)} ${vatAmount.toLocaleString()} ${t.currency}`, { align: 'right' });
    doc.fillColor('#000').fontSize(10);
    doc.moveDown(0.8);

    // === Grand Total (subtotal + VAT) ===
    const grandTotal = subtotal + vatAmount;
    doc.fontSize(16).fillColor('#E6A23C');
    doc.text(`${tStr(t.grandTotal)} ${grandTotal.toLocaleString()} ${t.currency}`, { align: 'right' });
    doc.fillColor('#000').fontSize(10);
    doc.moveDown(0.8);

    // === Bank info ===
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke('#ddd');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#333');
    doc.text(`${tStr(t.bankInfo)}`, leftX);
    doc.text(tStr(t.bankName), leftX + 15);
    doc.text(tStr(t.accountNo), leftX + 15);

    // === Remark ===
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
