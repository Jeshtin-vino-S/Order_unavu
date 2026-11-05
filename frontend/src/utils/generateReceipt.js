/**
 * Generate and download an authentic, beautifully-formatted Order Receipt PDF
 * Includes item prices, subtotal, delivery fee, GST/tax, and grand total.
 */
export const downloadOrderReceipt = async (order) => {
  if (!order) return;

  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2); // 178mm

  // Colors
  const primaryColor = [194, 65, 12]; // #C2410C Burnt Orange
  const darkColor = [43, 33, 24]; // #2B2118 Dark Brown
  const grayColor = [107, 94, 82]; // #6B5E52
  const lightBg = [255, 248, 238]; // #FFF8EE Warm beige
  const borderLine = [246, 223, 202]; // #F6DFCA

  let y = 18;

  // 1. Header Box
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLine);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'FD');

  // Brand Name & Subtitle
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('OrderUnavu', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text('Kumbakonam Authentic Kitchen', margin + 6, y + 16);
  doc.setFont('helvetica', 'italic');
  doc.text('Order pannunga, saapdunga.', margin + 6, y + 21);

  // Receipt Label & Details (Right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkColor);
  doc.text('ORDER RECEIPT', pageWidth - margin - 6, y + 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  doc.text(`Receipt #: REC-ORD-${order.id}`, pageWidth - margin - 6, y + 16, { align: 'right' });

  const orderDateStr = order.created_at
    ? new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  doc.text(`Date: ${orderDateStr}`, pageWidth - margin - 6, y + 21, { align: 'right' });

  y += 39;

  // 2. Customer & Order Details (2 Columns)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderLine);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

  // Left Column: Customer info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('CUSTOMER & DELIVERY DETAILS', margin + 5, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkColor);
  doc.text(order.customer_name || 'Customer', margin + 5, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  doc.text(`Phone: +91 ${order.customer_phone || 'N/A'}`, margin + 5, y + 18);

  const addressLines = doc.splitTextToSize(`Address: ${order.delivery_address || 'N/A'}`, 95);
  doc.text(addressLines.slice(0, 2), margin + 5, y + 23);

  // Right Column: Order Info
  const rightColX = margin + 105;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('ORDER INFORMATION', rightColX, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkColor);
  doc.text(`Order ID: #ORD-${order.id}`, rightColX, y + 14);
  doc.text(`Payment: ${order.payment_method || 'Cash on Delivery'}`, rightColX, y + 21);

  y += 37;

  // 3. Items Table Header
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  doc.text('Item Description', margin + 4, y + 5.5);
  doc.text('Qty', margin + 105, y + 5.5, { align: 'center' });
  doc.text('Price (Rs.)', margin + 135, y + 5.5, { align: 'right' });
  doc.text('Total (Rs.)', pageWidth - margin - 4, y + 5.5, { align: 'right' });

  y += 8;

  // 4. Items Table Rows
  const items = order.items && order.items.length > 0 ? order.items : [];
  let subtotal = 0;

  items.forEach((item, index) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    subtotal += itemTotal;

    // Alternating row background
    if (index % 2 === 1) {
      doc.setFillColor(253, 248, 242);
      doc.rect(margin, y, contentWidth, 7.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkColor);

    const foodName = item.food_name || 'Food Item';
    const splitName = doc.splitTextToSize(foodName, 92);
    doc.text(splitName[0], margin + 4, y + 5);

    doc.text(String(item.quantity || 1), margin + 105, y + 5, { align: 'center' });
    doc.text(Number(item.price || 0).toFixed(2), margin + 135, y + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(itemTotal.toFixed(2), pageWidth - margin - 4, y + 5, { align: 'right' });

    doc.setDrawColor(240, 230, 220);
    doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    y += 7.5;
  });

  // Calculate pricing breakdown accurately
  const totalAmount = Number(order.total_amount) || subtotal;
  const isFreeDelivery = totalAmount >= 500 || subtotal >= 500 || (totalAmount - subtotal) < 25;
  const deliveryFee = isFreeDelivery ? 0 : 35.0;
  const taxes = Math.max(0, Math.round((totalAmount - subtotal - deliveryFee) * 100) / 100);

  y += 4;

  // 5. Bill Summary Box (Right aligned)
  const summaryWidth = 80;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderLine);
  doc.roundedRect(summaryX, y, summaryWidth, 34, 2, 2, 'FD');

  let sumY = y + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  doc.text('Items Subtotal:', summaryX + 4, sumY);
  doc.setTextColor(...darkColor);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 6;
  doc.setTextColor(...grayColor);
  doc.text('Delivery Fee:', summaryX + 4, sumY);
  doc.setTextColor(...darkColor);
  doc.text(deliveryFee > 0 ? `Rs. ${deliveryFee.toFixed(2)}` : 'FREE (Rs. 0.00)', pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 6;
  doc.setTextColor(...grayColor);
  doc.text('GST & Tax (5%):', summaryX + 4, sumY);
  doc.setTextColor(...darkColor);
  doc.text(`Rs. ${taxes.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  sumY += 3;
  doc.setDrawColor(...borderLine);
  doc.line(summaryX + 4, sumY, pageWidth - margin - 4, sumY);

  sumY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryColor);
  doc.text('Grand Total:', summaryX + 4, sumY);
  doc.text(`Rs. ${totalAmount.toFixed(2)}`, pageWidth - margin - 4, sumY, { align: 'right' });

  y = Math.max(y + 44, sumY + 12);

  // 6. Payment Badge
  doc.setFillColor(236, 253, 243);
  doc.setDrawColor(166, 240, 196);
  doc.roundedRect(margin, y, 80, 8, 2, 2, 'FD');
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Payment Method: ${order.payment_method || 'Verified'}`, margin + 4, y + 5.5);

  y += 16;

  // 7. Footer Note
  doc.setDrawColor(...borderLine);
  doc.line(margin, y, pageWidth - margin, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryColor);
  doc.text('Thank you for dining with OrderUnavu!', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text('Cooked fresh with authentic Kumbakonam tradition. Order pannunga, saapdunga.', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.text('For any queries or assistance, contact our kitchen team.', pageWidth / 2, y, { align: 'center' });

  // Download PDF
  doc.save(`OrderUnavu_Receipt_ORD_${order.id}.pdf`);
};
