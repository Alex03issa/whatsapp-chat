import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstanceState } from "../services/api";
import "./LoginForm.css";

const LoginForm = ({ onLogin }) => { 
    const [idInstance, setIdInstance] = useState("");
    const [apiTokenInstance, setApiTokenInstance] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!idInstance || !apiTokenInstance) {
            setError("Please enter both Instance ID and API Token.");
            return;
        }

        try {
            console.log("Checking credentials...");
            
            // Verify if instance is authorized
            const instanceState = await getInstanceState(idInstance, apiTokenInstance);
            
            console.log("Instance State Response:", instanceState);

            // Check if the API response is valid
            if (!instanceState) {
                setError("No response from server. Please try again.");
                return;
            }

            if (!instanceState.stateInstance) {
                setError("Invalid response format. Check API compatibility.");
                return;
            }

            if (instanceState.stateInstance !== "authorized") {
                setError("Instance is not authorized. Please check your credentials.");
                return;
            }

            // Save credentials and redirect to Home
            const newCredentials = { idInstance, apiTokenInstance };
            localStorage.setItem("credentials", JSON.stringify(newCredentials));
            
            if (typeof onLogin === "function") {
                onLogin(newCredentials);
                navigate("/"); 
            } else {
                console.error("Error: `onLogin` is not a function");
            }
        } catch (err) {
            console.error("Login failed:", err);
            setError(`Failed to log in: ${err.message || "Unknown error"}`);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleLogin} className="login-box">
                <h2>Login to WhatsApp Clone</h2>
                {error && <p className="error-message">{error}</p>}
                <input
                    type="text"
                    placeholder="Instance ID"
                    value={idInstance}
                    onChange={(e) => setIdInstance(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="API Token"
                    value={apiTokenInstance}
                    onChange={(e) => setApiTokenInstance(e.target.value)}
                />
                <button type="submit" className="login-btn">Login</button>
            </form>
        </div>
    );
};

export default LoginForm; 
