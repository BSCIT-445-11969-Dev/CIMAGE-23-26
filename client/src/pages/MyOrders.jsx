import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets';

const MyOrders = () => {

    const [myOrders, setMyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currency, axios, user, navigate } = useAppContext();

    const fetchMyOrders = async () => {
        try {
            setLoading(true);
            const { data } = await axios.post('/api/order/user');
            
            if (data.success) {
                setMyOrders(data.orders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user) {
            fetchMyOrders();
        }
    }, [user])

    // 1. Not Logged In State
    if (!user) {
        return (
            <div className="mt-32 text-center">
                <p className="text-xl text-gray-500">Please login to view your orders.</p>
                <button onClick={() => navigate('/')} className="mt-4 bg-emerald-900 text-white px-6 py-2 rounded">
                    Go to Login
                </button>
            </div>
        );
    }

    // 2. Loading State
    if (loading) {
        return <div className="mt-32 text-center text-emerald-900 font-medium text-lg">Loading your orders...</div>;
    }

    // 3. Empty Orders State
    if (myOrders.length === 0) {
        return (
            <div className="mt-32 text-center">
                <p className="text-xl text-gray-500">You haven't placed any orders yet.</p>
                <button onClick={() => { navigate('/products'); window.scrollTo(0, 0) }} className="mt-4 text-green-600 underline font-medium">
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className='mt-16 pb-16'>
            <div className='flex flex-col items-end w-max mb-8'>
                <p className='text-2xl font-medium uppercase'>My Orders</p>
                <div className='w-16 h-0.5 bg-emerald-900 rounded-full'></div>
            </div>

            {myOrders.map((order, index) => (
                <div
                    key={index}
                    className='border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl shadow-sm bg-white'
                >
                    {/* Order Header */}
                    <div className='flex justify-between md:items-center text-emerald-900 md:font-medium max-md:flex-col border-b border-gray-100 pb-3 mb-3 gap-2'>
                        <div className="flex flex-col md:flex-row md:gap-6">
                            <span><span className="text-gray-400 font-normal">Order Id:</span> {order._id}</span>
                            <span><span className="text-gray-400 font-normal">Payment:</span> {order.paymentType}</span>
                        </div>
                        <span className="text-lg font-bold">{currency}{order.amount.toFixed(2)}</span>
                    </div>

                    {/* Order Items */}
                    {order.items.map((item, itemIndex) => (
                        <div
                            key={itemIndex}
                            className={`relative text-gray-600 ${
                                order.items.length !== itemIndex + 1 ? "border-b" : ""
                            } border-gray-100 flex flex-col md:flex-row md:items-center justify-between p-4 py-5 md:gap-16 w-full`}
                        >
                            <div className='flex items-center mb-4 md:mb-0'>
                                <div className='bg-gray-100 p-2 rounded-lg border border-gray-200'>
                                    <img
                                        src={item.product?.image?.[0] || assets.placeholder_image}
                                        alt={item.product?.name || "Product"}
                                        className='w-20 h-20 object-cover rounded'
                                    />
                                </div>
                                <div className='ml-4'>
                                    <h2 className='text-xl font-medium text-emerald-900'>
                                        {item.product?.name || "Product Unavailable"}
                                    </h2>
                                    <p className='text-sm text-gray-400 italic'>Category: {item.product?.category || "N/A"}</p>
                                </div>
                            </div>

                            <div className='text-gray-500 text-base'>
                                <p><span className="font-medium">Quantity:</span> {item.quantity || 1}</p>
                                <p><span className="font-medium">Status:</span> <span className="text-orange-600 font-semibold">{order.status}</span></p>
                                <p><span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>

                            <p className='text-emerald-900 text-lg font-semibold'>
                                {currency}{ ( (item.product?.offerPrice || 0) * (item.quantity || 1) ).toFixed(2) }
                            </p>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

export default MyOrders;