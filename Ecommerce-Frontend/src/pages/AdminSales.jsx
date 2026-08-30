import { useEffect, useState } from "react";
import { getSalesAnalytics } from "../api/adminApi";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function AdminSales() {

    const [sales, setSales] = useState([]);

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {

        try {

            const res = await getSalesAnalytics();

            setSales(res.data);

        } catch (err) {

            console.log(err);

        }

    };

    const labels = [
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

    const revenueData = new Array(12).fill(0);

    sales.forEach(item => {

        revenueData[item._id.month - 1] = item.revenue;

    });

    const data = {

        labels,

        datasets: [

            {

                label: "Revenue",

                data: revenueData,

                backgroundColor: "#3B82F6"

            }

        ]

    };

    const options = {

        responsive: true,

        plugins: {

            legend: {

                position: "top"

            },

            title: {

                display: true,

                text: "Monthly Sales Analytics"

            }

        }

    };

    return (
        <div className="w-full max-w-[1600px] mx-auto space-y-6">
            <div>
                <h1 className="text-2xl lg:text-[26px] font-bold text-gray-900 tracking-tight">
                    Sales Analytics
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Track monthly store sales performance and revenue metrics.
                </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">

                <Bar
                    data={data}
                    options={options}
                />

            </div>

        </div>

    );

}