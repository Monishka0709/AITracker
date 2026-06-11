import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    })


}


export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all the details" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be atleast 6 characters" });
        }

        const exists = await User.findOne({ email: email.toLowerCase() });

        if (exists) return res.status(400).json({ message: "User already registered" });

        const user = new User({
            name,
            email: email.toLowerCase(),
            password,
            avatar: name.charAt(0).toUpperCase()
        })
        await user.save();
        const token = signToken(user._id);
        res.status(201).json({ token })

    } catch (err) {
        res.status(500).json({ message: err.message })
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(404).json({ message: 'Email or password missing' })

        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user) return res.status(401).json({ message: 'Invalid Email' })

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        const token = signToken(user._id);
        res.json({ user, token });
    } catch (err) {
        res.status(500).json({ message: err.message })
    }

}


export const updateProfile = async (req, res) => {
    try{
        const {name, morningMotivation } = req.body;
        const user = await User.findById(req.user._id);

        if(name !== undefined ){
            user.name = name;
            user.avatar = name.charAt(0).toUpperCase();
        }
        if(morningMotivation !== undefined) {
            user.morningMotivation = morningMotivation;
        }
        await user.save();
        res.json({user});
        
    }catch(err) {
        res.status(500).json({ message: err.message })
    }
}

export const me = async (req, res) => {
    res.json({ user: req.user })
}

// import jwt from "jsonwebtoken";
// import User from "../models/User.js";
// import bcrypt from "bcryptjs";

// const signToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN || "30d",
//   });
// };

// export const register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "Please fill all the details" });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({ message: "Password must be at least 6 characters" });
//     }

//     const exists = await User.findOne({ email: email.toLowerCase() });
//     if (exists) return res.status(400).json({ message: "User already registered" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       avatar: name.charAt(0).toUpperCase(),
//     });

//     const token = signToken(user._id);
//     res.status(201).json({ success: true, user, token });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) return res.status(400).json({ message: "Email or password missing" });

//     const user = await User.findOne({ email: email.toLowerCase() });
//     if (!user) return res.status(401).json({ message: "Invalid Email" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: "Incorrect password" });
//     }

//     const token = signToken(user._id);
//     res.json({ success: true, user, token });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// export const updateProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);

//     if (!user) return res.status(404).json({ message: "User not found" });

//     const { name, morningMotivation } = req.body;

//     if (name !== undefined) {
//       user.name = name;
//       user.avatar = name.charAt(0).toUpperCase();
//     }
//     if (morningMotivation !== undefined) {
//       user.morningMotivation = morningMotivation;
//     }

//     await user.save();
//     res.json({ success: true, user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// export const me = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json({ success: true, user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
