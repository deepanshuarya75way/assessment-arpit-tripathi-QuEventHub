import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { showToast } from "../utils/toast";
import { Loader2, Calendar, MapPin, Clock, Users, Check } from "lucide-react";

const ClubDetails = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchClub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchClub = async () => {
    setLoading(true);
    setError("");
      try {
        const res = await api.get(`/clubs/${id}`);
      setClub(res.data.data || res.data);
      } catch (err) {
        console.error(err);
      setError("Unable to load club information. Please try again later.");
      } finally {
        setLoading(false);
      }
  };

  const handleJoin = async () => {
    if (!sessionStorage.getItem("token")) {
      showToast("Please login to join.", "info");
      navigate("/login", { state: { from: `/clubs/${id}` } });
      return;
    }
    try {
      setJoining(true);
      const res = await api.post(`/clubs/${id}/join`);
      showToast(res.data.message || "Joined club", "success");
      fetchClub();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Could not join club", "error");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin mx-auto text-purple-600" />
      </div>
    );
  }

  if (!club) {
    return <div className="p-8 text-center">{error || "Club not found"}</div>;
  }

  const imageSrc = club.imageUrl || club.image?.path;
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "null");
  const userId = currentUser?.id || currentUser?._id;
  const joined = Boolean(userId && club.members?.some((member) => {
    const memberId = typeof member === "object" ? member._id || member.id : member;
    return String(memberId) === String(userId);
  }));

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      {imageSrc && (
        <img
          src={imageSrc}
          alt={club.name}
          loading="lazy"
          decoding="async"
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
      )}
      <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
      <p className="text-sm text-gray-500 mb-4 capitalize">
        Category: {club.category}
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-4 text-gray-700">
        <div className="flex items-center gap-2">
          <Calendar /> <span>{club.meeting || "TBD"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock /> <span>{club.time || "TBD"}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin /> <span>{club.venue || "TBD"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Users size={18} className="text-purple-600" />
        <span>
          {club.members?.length || club.membersCount || 0} active members
        </span>
      </div>

      <div className="prose mb-6">{club.description}</div>

      <div className="flex gap-4 flex-wrap">
        <button
          onClick={handleJoin}
          disabled={joining || joined}
          className={`flex items-center gap-2 rounded px-4 py-2 transition disabled:cursor-not-allowed ${
            joined
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
          }`}
        >
          {joining && <Loader2 size={18} className="animate-spin" />}
          {joined && <Check size={18} />}
          {joined ? "Joined" : "Join Club"}
        </button>

        <button
          onClick={() => navigate("/clubs")}
          className="px-4 py-2 border rounded hover:bg-gray-50 transition"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ClubDetails;
