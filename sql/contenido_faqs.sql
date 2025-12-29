INSERT INTO faqs (category, question_key, lang, question, answer, position) VALUES
('payments','payments_q1','en',
'I’m interested in opening a purchasing account. Is it possible?',
'You may be eligible to open a credit purchasing account with us, subject to approval.',
1),
('payments','payments_q1','es',
'Me interesa abrir una cuenta de compras. ¿Es posible?',
'Puede ser elegible para abrir una cuenta de crédito con nosotros, sujeta a aprobación.',
1);

INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q2',
  'en',
  'Do you accept multiple international currencies?',
  'Yes. We accept payments in EUR and USD. Payments made in other currencies may be subject to additional charges due to exchange rates and bank fees.',
  2
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q2',
  'es',
  '¿Aceptan múltiples monedas internacionales?',
  'Sí. Aceptamos pagos en EUR y USD. Los pagos realizados en otras monedas pueden estar sujetos a cargos adicionales debido a tasas de cambio y comisiones bancarias.',
  2
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q3',
  'en',
  'What payment methods do you accept?',
  'We accept bank transfer / wire transfer (SEPA or international). Please instruct your bank to transfer the full amount shown on your quotation or proforma invoice and include your reference number.',
  3
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q3',
  'es',
  '¿Qué métodos de pago aceptan?',
  'Aceptamos transferencia bancaria (SEPA o internacional). Por favor instruya a su banco para transferir el importe total indicado en su cotización o factura proforma e incluya su número de referencia.',
  3
);


INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q4',
  'en',
  'What types of credit and debit cards do you accept?',
  'We accept most major credit and debit cards, including Visa, MasterCard and American Express. Depending on the card type and transaction value, a processing fee may apply.',
  4
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q4',
  'es',
  '¿Qué tipos de tarjetas de crédito y débito aceptan?',
  'Aceptamos la mayoría de las tarjetas de crédito y débito, incluidas Visa, MasterCard y American Express. Dependiendo del tipo de tarjeta y del valor de la transacción, puede aplicarse una comisión.',
  4
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q5',
  'en',
  'Do you accept PayPal as a payment method?',
  'Yes. PayPal payments can be made using the payment details provided on your quotation or invoice. Please contact our Sales Team if confirmation is required.',
  5
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q5',
  'es',
  '¿Aceptan PayPal como método de pago?',
  'Sí. Los pagos por PayPal pueden realizarse utilizando los datos de pago proporcionados en su cotización o factura. Contacte a nuestro equipo de ventas si necesita confirmación.',
  5
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q6',
  'en',
  'Is paying by cheque an option?',
  'Cheque payments are generally not preferred. In exceptional cases, alternative payment methods may be considered. Please contact our Sales Team for further details.',
  6
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'payments',
  'payments_q6',
  'es',
  '¿Es posible pagar con cheque?',
  'Los pagos con cheque generalmente no son preferidos. En casos excepcionales, pueden considerarse métodos de pago alternativos. Por favor contacte a nuestro equipo de ventas para más detalles.',
  6
);

INSERT INTO faqs (category, question_key, lang, question, answer, position)
VALUES (
  'shipping',
  'shipping_q1',
  'en',
  'What delivery information do you provide with each order?',
  'We offer various shipping options depending on the destination country. Available shipping methods, estimated delivery times and costs are clearly stated in all quotations. All quotations include an estimated delivery date to your agreed delivery address or collection point. Orders are calculated from the order confirmation date, excluding weekends and Dutch public holidays. If you notice any changes to delivery dates, please contact us immediately.',
  1
);

INSERT INTO faqs (category, question_key, lang, question, answer, position)
VALUES (
  'shipping',
  'shipping_q1',
  'es',
  '¿Qué información de entrega proporcionan con cada pedido?',
  'Ofrecemos varias opciones de envío según el país de destino. Los métodos de envío disponibles, los plazos estimados de entrega y los costes se indican claramente en todas las cotizaciones. Todas las cotizaciones incluyen una fecha estimada de entrega a la dirección acordada o punto de recogida. Los pedidos se calculan desde la fecha de confirmación, excluyendo fines de semana y festivos en los Países Bajos. Si observa cambios en las fechas de entrega, contáctenos de inmediato.',
  1
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'shipping',
  'shipping_q2',
  'en',
  'Can I request faster delivery?',
  'Yes. Our primary logistics partner is UPS, but we can also ship via DHL or FedEx upon request. Stock items typically ship within 24 hours of payment receipt. Expedited options such as next-day or same-day delivery may be available depending on location. Once your order ships, you will receive tracking details.',
  2
);


INSERT INTO faqs VALUES (
  DEFAULT,
  'shipping',
  'shipping_q2',
  'es',
  '¿Puedo solicitar una entrega más rápida?',
  'Sí. Nuestro socio logístico principal es UPS, pero también podemos enviar a través de DHL o FedEx bajo solicitud. Los artículos en stock suelen enviarse dentro de las 24 horas posteriores a la recepción del pago. Las opciones urgentes pueden estar disponibles según la ubicación. Recibirá los datos de seguimiento una vez enviado el pedido.',
  2
);


INSERT INTO faqs VALUES (
  DEFAULT,
  'shipping',
  'shipping_q3',
  'en',
  'Can I arrange my own shipping?',
  'Yes. You may arrange your own courier or use your own shipping account. You must inform us of your chosen carrier in advance. If you arrange your own shipping, all risk passes to you and we accept no liability for loss or damage during transit.',
  3
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'shipping',
  'shipping_q3',
  'es',
  '¿Puedo organizar mi propio envío?',
  'Sí. Puede organizar su propio transportista o utilizar su propia cuenta de envío. Debe informarnos con antelación del transportista elegido. Si organiza su propio envío, todo el riesgo se transfiere a usted y no aceptamos responsabilidad por pérdidas o daños durante el transporte.',
  3
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'shipping',
  'shipping_q4',
  'en',
  'Will I need to pay customs duties or import taxes?',
  'Yes. You are responsible for all customs duties, import taxes, VAT and clearance fees imposed by local authorities in the destination country. We do not accept liability for customs charges or delays caused by clearance procedures.',
  4
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'shipping',
  'shipping_q4',
  'es',
  '¿Debo pagar aranceles o impuestos de importación?',
  'Sí. Usted es responsable de todos los aranceles aduaneros, impuestos de importación, IVA y tasas de despacho impuestas por las autoridades locales del país de destino. No aceptamos responsabilidad por cargos ni retrasos causados por procedimientos aduaneros.',
  4
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'shipping',
  'shipping_q5',
  'en',
  'What causes most delivery delays?',
  'Delays may occur due to stock availability, carrier issues, customs clearance or force majeure events. If your order is delayed, please contact our Sales Team and we will investigate as quickly as possible.',
  5
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'shipping',
  'shipping_q5',
  'es',
  '¿Qué causa la mayoría de los retrasos en la entrega?',
  'Los retrasos pueden deberse a la disponibilidad de stock, problemas con el transportista, despacho aduanero o eventos de fuerza mayor. Si su pedido se retrasa, contacte a nuestro equipo de ventas y lo investigaremos lo antes posible.',
  5
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q1',
  'en',
  'What is your returns and refunds policy?',
  'If you wish to return an item, you must notify us within 7 days of delivery by contacting customer care and quoting your reference number. Approved items must be returned within a further 7 days. A minimum 20 percent restocking fee may apply. If no issues are reported within 7 days, the goods are deemed accepted.',
  1
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q1',
  'es',
  '¿Cuál es su política de devoluciones y reembolsos?',
  'Si desea devolver un artículo, debe notificarnos dentro de los 7 días posteriores a la entrega contactando a atención al cliente e indicando su número de referencia. Los artículos aprobados deben devolverse dentro de los siguientes 7 días. Puede aplicarse una tarifa mínima de reposición del 20 por ciento. Si no se informa ningún problema dentro de los 7 días, los productos se consideran aceptados.',
  1
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q2',
  'en',
  'What is the process for returning an item?',
  'Returned products must be complete and unused, in original manufacturer packaging with seals intact, and supplied with all accessories, manuals, cables and packaging materials. Incomplete or damaged returns may be refused.',
  2
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q2',
  'es',
  '¿Cuál es el proceso para devolver un artículo?',
  'Los productos devueltos deben estar completos y sin uso, en su embalaje original del fabricante con los sellos intactos, y acompañados de todos los accesorios, manuales, cables y materiales de embalaje. Las devoluciones incompletas o dañadas pueden ser rechazadas.',
  2
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q3',
  'en',
  'What is the process for returning a service exchange item?',
  'Service exchange units must be returned within 7 days of delivery. If the exchange item is not returned, you may be charged the price difference.',
  3
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q3',
  'es',
  '¿Cuál es el proceso para devolver un artículo de intercambio?',
  'Las unidades de intercambio de servicio deben devolverse dentro de los 7 días posteriores a la entrega. Si el artículo de intercambio no se devuelve, puede cobrarse la diferencia de precio.',
  3
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q4',
  'en',
  'How can I cancel my order?',
  'Once an order has been confirmed, non-stock items and specially sourced products cannot be cancelled unless defective. Approved cancellations may be subject to a handling charge. Software and custom-built products are excluded from cancellation rights.',
  4
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q4',
  'es',
  '¿Cómo puedo cancelar mi pedido?',
  'Una vez confirmado un pedido, los artículos fuera de stock y los productos especialmente adquiridos no pueden cancelarse salvo que sean defectuosos. Las cancelaciones aprobadas pueden estar sujetas a un cargo de gestión. El software y los productos fabricados a medida están excluidos del derecho de cancelación.',
  4
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q5',
  'en',
  'What should I do if my parts are faulty?',
  'If a fault occurs within the warranty period, please contact customer care. Our team will guide you through testing, repair, replacement or refund options.',
  5
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q5',
  'es',
  '¿Qué debo hacer si mis piezas son defectuosas?',
  'Si ocurre un fallo dentro del período de garantía, por favor contacte a atención al cliente. Nuestro equipo le guiará a través de las opciones de prueba, reparación, reemplazo o reembolso.',
  5
);


INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q6',
  'en',
  'What if I have a problem with my order?',
  'If you receive an incorrect item, notify us within 7 days of delivery. Items that are customised, obsolete or specially manufactured cannot be returned or cancelled.',
  6
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'returns',
  'returns_q6',
  'es',
  '¿Qué pasa si tengo un problema con mi pedido?',
  'Si recibe un artículo incorrecto, notifíquenos dentro de los 7 días posteriores a la entrega. Los artículos personalizados, obsoletos o fabricados especialmente no pueden devolverse ni cancelarse.',
  6
);



INSERT INTO faqs VALUES (
  DEFAULT,
  'warranty',
  'warranty_q1',
  'en',
  'Do pre-owned or exchanged products come with a warranty?',
  'Yes. All products supplied by us are guaranteed to be in working condition and include a minimum 12-month warranty, unless stated otherwise.',
  1
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'warranty',
  'warranty_q1',
  'es',
  '¿Los productos usados o de intercambio tienen garantía?',
  'Sí. Todos los productos suministrados por nosotros están garantizados en condición operativa e incluyen una garantía mínima de 12 meses, salvo que se indique lo contrario.',
  1
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'warranty',
  'warranty_q2',
  'en',
  'What is the warranty period for your products?',
  'Hardware products are covered by our warranty for up to 24 months, depending on condition. The warranty period begins on the date of delivery.',
  2
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'warranty',
  'warranty_q2',
  'es',
  '¿Cuál es el período de garantía de sus productos?',
  'Los productos de hardware están cubiertos por nuestra garantía hasta por 24 meses, dependiendo de la condición. El período de garantía comienza en la fecha de entrega.',
  2
);

INSERT INTO faqs VALUES (
  DEFAULT,
  'warranty',
  'warranty_q3',
  'en',
  'What options are available if an item is defective?',
  'Depending on the situation, we may offer repair, replacement or refund. Our liability is limited to repair or replacement at our discretion, or a refund of the original purchase price if no alternative is available.',
  3
);
INSERT INTO faqs VALUES (
  DEFAULT,
  'warranty',
  'warranty_q3',
  'es',
  '¿Qué opciones existen si un artículo es defectuoso?',
  'Dependiendo de la situación, podemos ofrecer reparación, reemplazo o reembolso. Nuestra responsabilidad se limita a la reparación o reemplazo a nuestra discreción, o al reembolso del precio de compra original si no hay alternativa disponible.',
  3
);









