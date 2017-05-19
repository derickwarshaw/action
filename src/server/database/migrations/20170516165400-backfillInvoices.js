import stripe from '../../billing/stripe';
import handleInvoiceCreated from '../../billing/handlers/invoiceCreated';

const fetchAllInvoices = async () => {
  const stripeInvoices = [];
  const options = {limit: 100};

  for (let i = 0; i < 100; i++) {
    if (i > 0) {
      options.starting_after = stripeInvoices[stripeInvoices.length - 1].id;
    }
    const invoiceLines = await stripe.invoices.list(options); // eslint-disable-line no-await-in-loop
    stripeInvoices.push(...invoiceLines.data);
    if (!invoiceLines.has_more) break;
  }
  return stripeInvoices;
};

exports.up = async (r) => {
  if (process.env.NODE_ENV === 'test') {
    console.warn('NODE_ENV is testing. Not backfilling invoices');
    return;
  }

  const stripeInvoices = await fetchAllInvoices();
  const invoiceIdsInDB = await r.table('Invoice')('id');
  const invoicesToHandle = stripeInvoices.filter((invoice) => !invoiceIdsInDB.includes(invoice.id));
  for (let i = 0; i < invoicesToHandle.length; i++) {
    const invoice = invoicesToHandle[i];
    await handleInvoiceCreated(invoice.id); // eslint-disable-line no-await-in-loop
  }
};

exports.down = async () => {
  // noop
};
