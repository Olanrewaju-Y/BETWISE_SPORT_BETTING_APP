

const handleUserSignUp = async (req, res) => {
      const {
      userName,
      password,
      below18,
      walletBalance,
      nickName,
      role,
      gender,
      country,
      interests,
    } = req.body;
 
  try {
    if (!userName || !password) {
      res.status(400).json({
        message: "All fields are required",
      });
      return console.log("Empty field Error Request was recieved");
    }

    const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!emailFormat.test(userName)) {
      res.status(400).json({
        message: "Invalid email format",
      });
      return console.log("Invalid email format request was recieved");
    }

  const passwordFormat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
       if(!passwordFormat.test(password)){
       res.status(400).json({
            message: "Invalid password format"
        })
        return console.log("Invalid password format request was recieved");
    }

    if (below18 === true) {
      res.status(400).json({
        message: "User must be 18 or above to register",
      });
      return console.log("User < 18 Error request was recieved");
    }
    
    const existingUser = await User.findOne({ userName });

    if (existingUser) {
      res.status(400).json({
        message: "UserName already exists, try login",
      });
      return console.log("UserName already exists error request was recieved");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userName,
      password: hashedPassword,
      below18,
      walletBalance,
      nickName,
      role,
      gender,
      country,
      interests,
    });

    await newUser.save();

    res.status(200).json({
      message: "User created successfully",
      user: {
        userName: newUser.userName,
        below18: newUser.below18,
        walletBalance: newUser.walletBalance,
        nickName: newUser.nickName,
        role: newUser.role,
        gender: newUser.gender,
        country: newUser.country,
        interests: newUser.interests,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        }, 
    });
    return console.log("User created successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
} 

const handleUserLogin = async (req, res) => {
    const { userName, password } = req.body;

   try{
  // First stage validation on inputs

    if(!userName || !password){
        res.status(400).json({
            message: "All fields are required"
        })
      return console.log("Empty field Error Request was recieved");
    }

    const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordFormat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if(!emailFormat.test(userName)){
       res.status(400).json({
            message: "Incorrect email format"
        })
        return console.log("Incorrect email format request was recieved");
    }

    if(!passwordFormat.test(password)){
         res.status(400).json({
            message: "Incorrect password format"
        })
        return console.log("Incorrect password format request was recieved");
    } 

    // second stage validation with database
    const existingUser = await User.findOne({ userName })

    if (!existingUser) {
       res.status(400).json({
            message: "Incorrect username or password"
        })
        return console.log("Incorrect username or password request was recieved");
    }

    const passwordMatch = await bcrypt.compare(password, existingUser?.password)
    if(!passwordMatch){
         res.status(400).json({
            message: "Incorrect password or username"
        })
        return console.log("Incorrect password or username request was recieved");
    }

    // Generate tokens for geniue users
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN
    const REFRESH_TOKEN = process.env.REFRESH_TOKEN

    const accessToken = jwt.sign(
      {id: existingUser?._id}, 
      ACCESS_TOKEN, 
      {expiresIn: "5m"}
    )

    const refreshToken = jwt.sign(
      {id: existingUser?._id}, 
      REFRESH_TOKEN, 
      {expiresIn: "7d"}

    )

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            userName: existingUser?.userName,
            below18: existingUser?.below18,
            walletBalance: existingUser?.walletBalance,
            nickName: existingUser?.nickName,
            role: existingUser?.role,
            gender: existingUser?.gender,
            country: existingUser?.country,
            interests: existingUser?.interests,
            userId: existingUser?._id,
            createdAt: existingUser?.createdAt,
            updatedAt: existingUser?.updatedAt,
        },
        accessToken
    })
    return console.log("User logged in successfully");

   }
   catch(error){
    res.status(500).json({ message: error.message });
   }
}

const handleAdminCreateEvent = async (req, res) => { // Added authenticateToken middleware
  
  // Data now comes from req.body, but user identity/role comes from req.user (set by middleware)
  const { eventType, eventDescription, eventImage, homeTeam, homeTeamOdd, awayTeam, awayTeamOdd, amount, eventStatus, eventReviews, eventDate, eventTime } = req.body;
  const adminUser = req.user; // User object from authenticated token

  try {
    // --- Authorization Check (using trusted req.user.role) ---
    if (adminUser.role !== "admin") {
      return res.status(403).json({
        message: "User is not authorized to post games. Admin privileges required.",
      });
    }

    // --- Event Data Validation ---
    if (!eventType || !homeTeam || !awayTeam || !eventDescription || !eventDate || !eventTime) {
        res.status(400).json({
            message: "All core event fields are required: eventType, homeTeam, awayTeam, eventDescription, eventDate, eventTime."
        });
        return;
    }

    // --- Create and Save New Event ---
    const newEvent = new Event({
      userId: adminUser._id, // CRITICAL: Set the userId from the authenticated admin
      // publicEventId: generatedPublicEventId, // Assign the generated public ID
      eventType,      
      homeTeam, 
      homeTeamOdd, 
      awayTeam, 
      awayTeamOdd,
      eventDescription,
      eventImage,
      amount,
      eventStatus: eventStatus, // Let schema default handle it if not provided
      eventReviews: eventReviews, // Let schema default handle it if not provided
      eventDate,
      eventTime
    });

    await newEvent.save();

    res.status(201).json({
      message: "Event created successfully by admin.",
      event: newEvent
    });
    console.log("Event created successfully by admin:", adminUser.userName);

  } catch (error) {
    console.error("Error in /create-event:", error);
    res.status(500).json({ message: "Server error while creating event.", error: error.message });
  }
}




module.exports = {
  handleUserSignUp,
  handleUserLogin,
  handleAdminCreateEvent
};
