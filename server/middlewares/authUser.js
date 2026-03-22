import jwt from "jsonwebtoken";



const authUser = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.json({ success: false, message: "Unauthorized" });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        
        // Use tokenDecode.id to match your login/register payload
        if (tokenDecode.id) {
            // Assign to req directly to avoid 'undefined' body errors
            req.userId = tokenDecode.id; 
            next();
        } else {
            return res.json({ success: false, message: "Unauthorized" });
        }
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export default authUser;