class User {
  constructor(id, email, passwordHash, role) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
  }
}

module.exports = User;
