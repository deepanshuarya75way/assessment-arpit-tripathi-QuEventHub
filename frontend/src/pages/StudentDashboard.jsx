import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Loader2, MapPin, Users } from "lucide-react";
import api from "../api";

export default function StudentDashboard() {
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/events"), api.get("/clubs")])
      .then(([eventsResponse, clubsResponse]) => {
        setEvents((eventsResponse.data.data || eventsResponse.data || []).slice(0, 4));
        setClubs((clubsResponse.data.data || clubsResponse.data || []).slice(0, 4));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl bg-gradient-to-br from-[#102a43] via-blue-800 to-cyan-600 p-6 text-white shadow-xl sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Student dashboard</p>
          <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {user?.name?.split(" ")[0] || "student"}.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">Your space to discover events, find communities, and plan your campus week.</p>
            </div>
            <Link to="/profile" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/25">View profile <ArrowRight size={17} /></Link>
          </div>
        </section>

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div> : (
          <>
            <DashboardSection title="Upcoming events" link="/events" label="Explore all events">
              {events.length === 0 ? <EmptyState text="No events are available right now." /> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{events.map((event) => <Link key={event._id} to={`/events/${event._id}`} className="student-card group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl"><div className="relative h-24 overflow-hidden bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400"><div className="absolute -right-4 -top-8 h-28 w-28 rounded-full border-[14px] border-white/10" /><span className="absolute bottom-3 left-5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">{event.category || "Campus"}</span></div><div className="flex flex-1 flex-col p-5"><h2 className="line-clamp-2 min-h-14 text-lg font-bold leading-7 text-slate-900 group-hover:text-blue-700">{event.title}</h2><div className="mt-4 space-y-2.5"><p className="flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={16} className="text-blue-600" />{event.date ? new Date(event.date).toLocaleDateString() : "Date TBD"}</p><p className="flex items-center gap-2 truncate text-sm text-slate-500"><MapPin size={16} className="text-cyan-600" />{event.venue || "Venue TBD"}</p></div><div className="mt-5 border-t border-slate-100 pt-3 text-sm font-bold text-blue-600">View event <ArrowRight size={15} className="ml-1 inline transition group-hover:translate-x-1" /></div></div></Link>)}</div>}
            </DashboardSection>

            <DashboardSection title="Communities for you" link="/clubs" label="Browse all clubs">
              {clubs.length === 0 ? <EmptyState text="No clubs are available right now." /> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{clubs.map((club) => <Link key={club._id} to={`/clubs/${club._id}`} className="student-card group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-fuchsia-300 hover:shadow-xl"><div className="h-24 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur"><Users size={21} /></div></div><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-3"><h2 className="truncate text-lg font-bold text-slate-900 group-hover:text-purple-700">{club.name}</h2><span className="shrink-0 text-xs font-bold uppercase tracking-wide text-purple-600">{club.category || "Community"}</span></div><p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500">{club.description || "Find students who share your interests."}</p><div className="mt-5 border-t border-slate-100 pt-3 text-sm font-bold text-purple-600">View community <ArrowRight size={15} className="ml-1 inline transition group-hover:translate-x-1" /></div></div></Link>)}</div>}
            </DashboardSection>
          </>
        )}
      </div>
    </div>
  );
}

function DashboardSection({ title, link, label, children }) {
  return <section><div className="mb-4 flex items-end justify-between gap-4"><h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2><Link to={link} className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">{label} <ArrowRight size={16} /></Link></div>{children}</section>;
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{text}</div>;
}
