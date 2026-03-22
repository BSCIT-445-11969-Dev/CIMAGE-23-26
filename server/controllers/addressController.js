import Address from "../models/address.js"



// Add address: /api/address/add
export const addAddress = async (req, res) => {
    try {
        const { address } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.json({ success: false, message: "User not authenticated" });
        }

        await Address.create({ ...address, userId });

        res.json({ success: true, message: 'Address added successfully' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get Address: /api/address/get
export const getAddress = async (req, res) => {
    try {
        const userId = req.userId; // Provided by authUser middleware
        const addresses = await Address.find({ userId });
        
        res.json({ success: true, addresses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
