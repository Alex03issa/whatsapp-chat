import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login"; 
import "./App.css";

const App = () => {
    const [credentials, setCredentials] = useState(() => {
        const storedCredentials = localStorage.getItem("credentials");
        return storedCredentials ? JSON.parse(storedCredentials) : null;
    });

    const updateCredentials = (newCredentials) => {
        if (newCredentials && newCredentials.idInstance && newCredentials.apiTokenInstance) {
            localStorage.setItem("credentials", JSON.stringify(newCredentials));
            setCredentials(newCredentials);
        } else {
            localStorage.removeItem("credentials");
            setCredentials(null);
        }
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login setCredentials={updateCredentials} />} />
                <Route path="/" element={credentials ? <Home setCredentials={updateCredentials} credentials={credentials} /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;
