import { Sale } from "@/types/sale.types";

interface InvoiceProps {
  sale: Sale;
}

export default function Invoice({ sale }: InvoiceProps) {
  return (
    <div className="invoice-container max-w-[800px] mx-auto bg-white p-10 ">
      {/* Header */}
      <div className="header text-center mb-8 border-b-[3px] border-[#4a90e2] pb-5">
        <div className="pharmacy-name text-[32px] font-bold text-[#4a90e2] mb-1">
          PHARMINO
        </div>
        <div className="pharmacy-tagline text-sm text-gray-500 mb-2">
          Your Trusted Healthcare Partner
        </div>
        <div className="invoice-title text-2xl font-bold text-gray-800 mt-4">
          INVOICE
        </div>
      </div>

      {/* Info Section */}
      <div className="info-section flex justify-between mb-8 p-5 bg-gray-50 rounded-lg">
        <div className="info-block flex-1">
          <div className="info-label text-xs text-gray-500 uppercase mb-1">
            Sale ID
          </div>
          <div className="info-value text-sm text-gray-800 font-semibold">
            #{sale.id}
          </div>
        </div>
        <div className="info-block flex-1">
          <div className="info-label text-xs text-gray-500 uppercase mb-1">
            Date
          </div>
          <div className="info-value text-sm text-gray-800 font-semibold">
            {new Date(sale.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <div className="info-block flex-1">
          <div className="info-label text-xs text-gray-500 uppercase mb-1">
            Customer
          </div>
          <div className="info-value text-sm text-gray-800 font-semibold">
            {sale.customer?.name || "Walk-in Customer"}
          </div>
        </div>
        <div className="info-block flex-1">         
        </div>
      </div>

      {/* Items Table */}
      <table className="items-table w-full border-collapse mb-8">
        <thead className="bg-[#4a90e2] text-white">
          <tr>
            <th className="p-3 text-left text-[13px] font-semibold w-[50px]">
              #
            </th>
            <th className="p-3 text-left text-[13px] font-semibold">
              Item Name
            </th>
            <th className="p-3 text-center text-[13px] font-semibold w-[100px]">
              Quantity
            </th>
            <th className="p-3 text-right text-[13px] font-semibold w-[120px]">
              Unit Price
            </th>
            <th className="p-3 text-right text-[13px] font-semibold w-[120px]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {sale.saleItems.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="p-3 border-b border-gray-200 text-[13px] text-gray-700">
                {index + 1}
              </td>
              <td className="p-3 border-b border-gray-200 text-[13px] text-gray-700">
                <div>
                  <strong>
                    {item.item?.itemName || `Item ${item.itemId}`}
                  </strong>
                </div>
                {item.sellType && (
                  <div className="text-[11px] text-gray-500">
                    {item.sellType === "SINGLE_TABLET"
                      ? "Single Tablets"
                      : item.sellType === "FULL_STRIP"
                        ? "Full Strip"
                        : "ML"}
                  </div>
                )}                
              </td>
              <td className="p-3 border-b border-gray-200 text-[13px] text-gray-700 text-center">
                {item.quantity}
              </td>
              <td className="p-3 border-b border-gray-200 text-[13px] text-gray-700 text-right">
                ${Number(item.unitPrice).toFixed(2)}
              </td>
              <td className="p-3 border-b border-gray-200 text-[13px] text-gray-700 text-right">
                ${Number(item.totalPrice).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="totals-section ml-auto w-[300px] p-5 bg-gray-50 rounded-lg">
        <div className="total-row flex justify-between py-2 text-sm">
          <span>Subtotal:</span>
          <span>${Number(sale.subtotal).toFixed(2)}</span>
        </div>
        {Number(sale.discountAmount) > 0 && (
          <div className="total-row flex justify-between py-2 text-sm text-red-600">
            <span>Discount:</span>
            <span>-${Number(sale.discountAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="total-row grand-total flex justify-between py-2 text-lg font-bold text-gray-800 border-t-2 border-[#4a90e2] mt-2 pt-4">
          <span>Grand Total:</span>
          <span>${Number(sale.grandTotal).toFixed(2)}</span>
        </div>
        <div className="total-row flex justify-between py-2 text-sm mt-4">
          <span>Payment Method:</span>
          <span className="font-semibold">{sale.paymentMethod}</span>
        </div>
        <div className="total-row flex justify-between py-2 text-sm">
          <span>Payment Status:</span>
          <span            
          >
            {sale.paymentStatus}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="footer mt-10 text-center pt-5 border-t-2 border-gray-200 text-gray-500 text-xs">
        <p className="font-bold">Thank you for your business!</p>
        <p className="mt-2">
          For any queries, please contact us at support@pharmino.com
        </p>
        <p className="mt-1">
          This is a computer-generated invoice and does not require a signature.
        </p>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @page {
          margin: 0;
          size: auto;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .invoice-container {
            border: none !important;
            padding: 20px !important;
            margin: 0 !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
