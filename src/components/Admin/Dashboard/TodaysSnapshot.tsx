import { DollarSign, ShoppingCart, RotateCcw, RefreshCw, Package, TrendingUp } from "lucide-react";

interface TodaysSnapshotProps {
  todaysRevenue: number;
  todaysOrders: number;
  todaysReturns: number;
  todaysRefundAmount: number;
  todaysPurchases: number;
  todaysPurchaseValue: number;
}

export default function TodaysSnapshot({
  todaysRevenue,
  todaysOrders,
  todaysReturns,
  todaysRefundAmount,
  todaysPurchases,
  todaysPurchaseValue,
}: TodaysSnapshotProps) {
  return (
    <div className="bg-blue-400 rounded-xl p-6 text-white">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold">Today's Snapshot</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaysRevenue.toLocaleString()}</p>
              <p className="text-sm">Revenue</p>
              <p className="text-xs">Total sales today</p>
            </div>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaysOrders}</p>
              <p className="text-sm"> Sales</p>
              <p className="text-xs">Sales completed</p>
            </div>
          </div>
        </div>

        {/* Today's Returns */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaysReturns}</p>
              <p className="text-sm">Returns</p>
              <p className="text-xs">Items returned</p>
            </div>
          </div>
        </div>

        {/* Today's Refund Amount */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaysRefundAmount.toLocaleString()}</p>
              <p className="text-sm">Refund Amount</p>
              <p className="text-xs">Total refunded</p>
            </div>
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaysPurchases}</p>
              <p className="text-sm">Items Received</p>
              <p className="text-xs">Received today</p>
            </div>
          </div>
        </div>

        {/* Today's Purchase Value */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todaysPurchaseValue.toLocaleString()}</p>
              <p className="text-sm">Purchase Value</p>
              <p className="text-xs">Total cost today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}