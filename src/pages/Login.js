import React from "react";
import LoginForm from "../components/LoginForm";

const Login = ({ setCredentials }) => {
    return (
        <div className="login-page">
            <LoginForm onLogin={setCredentials} />
        </div>
    );
};

export default Login;
