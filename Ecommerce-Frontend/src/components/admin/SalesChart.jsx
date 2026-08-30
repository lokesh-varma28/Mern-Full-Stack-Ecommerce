import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from "recharts";

export default function SalesChart({ data }) {

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
        revenue: item.revenue,
        orders: item.orders
    }));

    return (

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm h-full flex flex-col justify-between">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Monthly Revenue
            </h2>

            <ResponsiveContainer
                width="100%"
                height={350}
            >

                <LineChart data={chartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={3}
                    />

                </LineChart>

            </ResponsiveContainer>

        </div>

    );

}