import { invoiceNumber, money } from "@/lib/format";

export type InvoiceData = {
  id: string;
  number: number;
  totalCents: number;
  createdAt: string;
  items: { id: string; kind: string; description: string; quantity: number; unitPriceCents: number }[];
};

export default function InvoiceCard({ invoice }: { invoice: InvoiceData }) {
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <div className="mb-2 flex justify-between">
        <span className="font-semibold text-slate-900">Invoice {invoiceNumber(invoice.number)}</span>
        <span className="text-slate-500">{new Date(invoice.createdAt).toLocaleDateString()}</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {invoice.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4 py-1.5">
            <span className="whitespace-pre-wrap break-words text-slate-700">
              {i.description}
              {i.quantity > 1 ? ` × ${i.quantity}` : ""}
              <span className="ml-2 text-xs text-slate-400">{i.kind === "PART" ? "Part" : "Service"}</span>
            </span>
            <span className="shrink-0 font-medium">{money(i.quantity * i.unitPriceCents)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
        <span>Total</span>
        <span>{money(invoice.totalCents)}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">No tax is applied in this version.</p>
    </div>
  );
}