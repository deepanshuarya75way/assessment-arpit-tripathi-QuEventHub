import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { showToast } from "../utils/toast";
import { Loader2, Calendar, Clock, MapPin, DollarSign, CheckCircle } from "lucide-react";

const initialStatus = { state: "idle", message: "", amount: null, qrCodeUrl: null };

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regStatus, setRegStatus] = useState(initialStatus);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.data || res.data);
      setRegStatus(initialStatus);
      setTransactionId("");
    } catch (error) {
      console.error("Error fetching event:", error);
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (!sessionStorage.getItem("token")) {
        showToast("You must log in to register for an event.", "info");
      navigate("/login", { state: { from: window.location.pathname } });
        return;
    }
    
    setRegStatus((prev) => ({
      ...prev,
      state: "pending",
      message: "Processing registration...",
    }));

    try {
      const payload = { eventId: id };
      if (event.isPaid && transactionId) {
        payload.transactionId = transactionId;
      }

      const res = await api.post("/events/register", payload);
      
      if (res.data.requiresPayment) {
        setRegStatus({
          state: "requiredPayment",
          message: res.data.message,
          amount: res.data.amount,
          qrCodeUrl: res.data.qrCodeUrl,
        });
        return;
      }

      setRegStatus({
        state: "registered",
        message: res.data.message || "Successfully registered for the event!",
        amount: null,
        qrCodeUrl: null,
      });
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed.";
      if (msg.includes("Already registered")) {
        setRegStatus({
          state: "registered",
          message: msg,
          amount: null,
          qrCodeUrl: null,
        });
      } else {
        setRegStatus({ state: "error", message: msg, amount: null, qrCodeUrl: null });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 size={48} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!event) {
    return <div className="min-h-screen text-center py-20">Event not found.</div>;
  }

  const isPaid = event.isPaid;
  const isRegistered = regStatus.state === "registered";
  const imageSrc = event.imageUrl || event.image?.path;

  return (
    <div className="max-w-4xl mx-auto p-6 my-10 bg-white shadow-2xl rounded-lg">
      <h1 className="text-4xl font-extrabold text-blue-700 mb-4">{event.title}</h1>
      <p className="text-lg text-gray-600 mb-6 font-medium border-b pb-4">Category: {event.category}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
            <Calendar size={20} className="text-blue-500" />
                <span className="font-semibold">Date:</span> {new Date(event.date).toDateString()}
            </div>
            <div className="flex items-center gap-3 text-gray-700">
            <Clock size={20} className="text-blue-500" />
            <span className="font-semibold">Time:</span> {event.time || "TBD"}
            </div>
            <div className="flex items-center gap-3 text-gray-700">
            <MapPin size={20} className="text-blue-500" />
            <span className="font-semibold">Venue:</span> {event.venue || "TBD"}
            </div>
            <div className="flex items-center gap-3 text-gray-700">
            <DollarSign size={20} className="text-blue-500" />
            <span className="font-semibold">Price:</span> {isPaid ? `₹${event.price}` : "Free"}
            </div>
        </div>
        
        {imageSrc && (
          <img
            src={imageSrc}
            alt={event.title}
            loading="lazy"
            decoding="async"
            className="w-full h-48 object-cover rounded-lg shadow-md"
          />
        )}
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">Event Details</h2>
      <p className="text-gray-700 leading-relaxed mb-8">{event.description}</p>

      <div className="mt-8 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
          <h3 className="text-xl font-bold mb-3 text-blue-700">Registration Status</h3>
          
        {regStatus.state === "error" && (
             <p className="p-2 mb-3 rounded bg-red-100 text-red-600 font-medium">{regStatus.message}</p>
          )}

          {isRegistered ? (
          <div className="flex items-center text-green-600 font-bold text-lg p-3 bg-green-100 rounded-lg">
            <CheckCircle size={24} className="mr-2" /> {regStatus.message}
          </div>
          ) : (
              <>
            {isPaid && (
                    <div className="p-4 bg-yellow-50 rounded-lg mb-4 border border-yellow-300">
                <p className="font-semibold text-orange-700 mb-3">
                  {regStatus.state === "requiredPayment"
                    ? regStatus.message
                    : "This is a paid event. Complete the payment and share the transaction ID."}
                </p>
                {(regStatus.qrCodeUrl || event.paymentQrCode) && (
                  <img
                    src={regStatus.qrCodeUrl || event.paymentQrCode}
                    alt="Payment QR Code"
                    loading="lazy"
                    decoding="async"
                    className="w-40 h-40 object-contain mx-auto my-4 border p-1 rounded"
                  />
                )}
                <p className="text-sm mb-3">Amount: ₹{regStatus.amount || event.price || 0}</p>
                        <input 
                            type="text"
                            placeholder="Enter Transaction ID after payment"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full p-2 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                )}
                
                <button 
                    onClick={handleRegistration}
              disabled={regStatus.state === "pending"}
              className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex justify-center items-center disabled:opacity-60"
                >
              {regStatus.state === "pending" ? (
                <>
                  <Loader2 size={24} className="animate-spin mr-2" /> Submitting...
                </>
              ) : isPaid ? (
                "Submit Registration"
              ) : (
                "One-Click Register"
              )}
                </button>
            </>
          )}
      </div>
    </div>
  );
}
