import React, { useState } from "react";


function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // هنا تعمل اتصال بالباك إند تبعك (API)
  fetch("http://localhost:5001/F_pass", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),


})
  .then((res) => res.json())
  .then((data) => {
    if (data.messages) setMessages(data.messages);
  })
  .catch((err) => console.error(err));


      


     
      
      
  };

  return (
    <div className="container">
      <h2>نسيت كلمة المرور</h2>

      {messages.length > 0 && (
        <ul className="flash-messages error">
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit}>
        <label>Eemai shriben bitte </label>
        <br />
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <br />
        <button type="submit">إرسال</button>
      </form>

      <p>
        <a href="/login">العودة لتسجيل الدخول</a>
      </p>
    </div>
  );
}

export default ForgotPassword;
