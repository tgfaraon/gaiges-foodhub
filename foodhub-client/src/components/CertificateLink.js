import React, { useState, useEffect } from "react";
import axios from "axios";

export default function CertificateLink({ userId }) {
    const [certificate, setCertificate] = useState(null);
    const [open, setOpen] = useState(false);

    //Resend Email Logic
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const apiUrl = process.env.REACT_APP_API_URL;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    useEffect(() => {
        async function fetchCertificate() {
            try {
                const res = await axios.get(
                    `${apiUrl}/api/certificates/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                if (res.data?.exists) { setCertificate(res.data); }
            } catch (err) {
                console.error("Error fetching certificate:", err);
            }
        }
        fetchCertificate();
    }, [userId, apiUrl]);

    if (!certificate) return null;

    return (
        <div style={{ marginTop: "20px" }}>
            {/* Button to open viewer */}
            <button
                onClick={() => setOpen(true)}
                style={{
                    backgroundColor: "rgb(193, 154, 107)", // caramel 
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                }}
            >
                View Certificate
            </button>

            {/* Modal viewer */}
            {open && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                    }}
                >
                    <div
                        style={{
                            width: "80%",
                            height: "80%",
                            backgroundColor: "rgb(245, 238, 230)", // beige 
                            borderRadius: "12px",
                            padding: "20px",
                            position: "relative",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                            border: "2px solid rgb(49, 29, 10)", // espresso border 
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                                background: "transparent",
                                border: "none",
                                fontSize: "22px",
                                cursor: "pointer",
                                color: "rgb(49, 29, 10)",
                            }}
                        >
                            ✕
                        </button>

                        {/* Title */}
                        <h2
                            style={{
                                textAlign: "center",
                                marginBottom: "10px",
                                fontSize: "32px",
                                color: "rgb(194, 146, 107)", // caramel fill 
                                WebkitTextStroke: "1.5px rgb(49, 29, 10)", // espresso outline 
                            }}
                        >
                            Your Culinary Mastery Certificate
                        </h2>

                        {/* PDF Viewer */}
                        <embed
                            src={`${apiUrl}/api/certificates/${userId}/pdf?token=${token}`}
                            type="application/pdf"
                            style={{
                                width: "100%",
                                height: "75%",
                                borderRadius: "8px",
                                border: "1px solid rgb(193, 154, 107)",
                            }} />

                        {/* Action buttons */}
                        <div
                            style={{
                                marginTop: "15px",
                                display: "flex",
                                justifyContent: "center",
                                gap: "20px",
                            }}
                        >
                            <a
                                href={`${apiUrl}/api/certificates/${userId}/pdf?token=${token}`}
                                download="FoodHub-Certificate.pdf"
                                style={{
                                    backgroundColor: "rgb(193, 154, 107)",
                                    color: "white",
                                    padding: "10px 18px",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    fontWeight: "600",
                                }}
                            >
                                Download PDF
                            </a>

                            <button onClick={async () => {
                                setResending(true);
                                setResendMessage("");
                                try {
                                    await axios.post(`${apiUrl}/api/certificates/resend`,
                                        { userId },
                                        {
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                    setResendMessage("Certificate email resent!");
                                } catch (err) {
                                    console.error("Resend error:", err);
                                    setResendMessage("Failed to resend certificate.");
                                } finally {
                                    setResending(false);
                                }
                            }}
                            >
                                Resend Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}