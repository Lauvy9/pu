export function formatCurrency(value) {
	if (!value && value !== 0) return '$0,00';
	try {
		return new Intl.NumberFormat('es-AR', {
			style: 'currency',
			currency: 'ARS',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(Number(value || 0));
	} catch (e) {
		// fallback simple formatting
		const n = Number(value || 0).toFixed(2).replace('.', ',')
		return `$${n}`
	}
}

export function parseDate(value) {
if (!value) return null;
if (value instanceof Date) return isNaN(value) ? null : value;


if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
const d = new Date(value);
return isNaN(d) ? null : d;
}


if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
const parts = value.split(',');
const datePart = parts[0].trim();
const [dd, mm, yyyy] = datePart.split('/');
let d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
if (parts[1]) {
const time = parts[1].trim();
const tparts = time.split(':').map(tp => Number(tp));
if (!isNaN(tparts[0])) d.setHours(tparts[0] || 0, tparts[1] || 0, tparts[2] || 0, 0);
}
return isNaN(d) ? null : d;
}


const d = new Date(value);
return isNaN(d) ? null : d;
}


export function startOfDay(dateLike) {
const d = parseDate(dateLike);
if (!d) return null;
return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}


export function endOfDay(dateLike) {
const d = parseDate(dateLike);
if (!d) return null;
return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}


export function isPaymentOnOrBeforeDue(paymentDate, dueDate) {
const pay = parseDate(paymentDate);
const due = endOfDay(dueDate);
if (!pay || !due) return false;
return pay.getTime() <= due.getTime();
}


export function isAfterDue(dateCheck, dueDate) {
const now = parseDate(dateCheck) || new Date();
const dueEnd = endOfDay(dueDate);
if (!dueEnd) return false;
return now.getTime() > dueEnd.getTime();
}


export function parseToLocalDate(isoString) {
if (!isoString) return null;
if (isoString instanceof Date) return isoString;
}

export function toLocalYMD(date) {
if (!date) return '';
const d = date instanceof Date ? date : new Date(date);
if (isNaN(d)) return '';
const year = d.getFullYear();
const month = String(d.getMonth() + 1).padStart(2, '0');
const day = String(d.getDate()).padStart(2, '0');
return `${year}-${month}-${day}`;
};