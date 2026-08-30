import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from "recharts";

export default function OrdersChart({ data }) {

    const months = [
        "",
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];

    const chartData = data.map(item => ({
        month: months[item._id.month],
        orders: item.orders
    }));

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col justify-between">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Monthly Orders
            </h2>

            <ResponsiveContainer width="100%" height={350}>

                <BarChart data={chartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip />

                    <Bar
                        dataKey="orders"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                    />

                </BarChart>

            </ResponsiveContainer>

        </div>
    );
}