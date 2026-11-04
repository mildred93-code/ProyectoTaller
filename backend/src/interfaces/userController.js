class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await this.userService.login(email, password);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(401).json({ success: false, message: error.message });
    }
  };

  register = async (req, res) => {
    try {
      const { email, password, role } = req.body;
      const result = await this.userService.register(email, password, role);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = UserController;