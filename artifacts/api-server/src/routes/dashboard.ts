import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const client = (req as any).supabaseClient;
    const user = (req as any).supabaseUser;
    const role = (req as any).userRole;

    // Apply role-based scoping at the query level for safety (defense in depth)
    let patientQuery = client.from("patients").select("id", { count: "exact", head: true });
    let appointmentsTodayQuery = client.from("appointments").select("id", { count: "exact", head: true }).gte("date", today).lt("date", today + "T23:59:59");
    let pendingQuery = client.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending");
    let completedQuery = client.from("appointments").select("id", { count: "exact", head: true }).eq("status", "completed");

    if (role === "doctor") {
      patientQuery = patientQuery.eq("created_by", user.id);
      appointmentsTodayQuery = appointmentsTodayQuery.eq("doctor_id", user.id);
      pendingQuery = pendingQuery.eq("doctor_id", user.id);
      completedQuery = completedQuery.eq("doctor_id", user.id);
    }

    const [patientsRes, appointmentsTodayRes, pendingRes, completedRes] = await Promise.all([
      patientQuery,
      appointmentsTodayQuery,
      pendingQuery,
      completedQuery,
    ]);

    res.json({
      total_patients: patientsRes.count ?? 0,
      appointments_today: appointmentsTodayRes.count ?? 0,
      pending_appointments: pendingRes.count ?? 0,
      completed_appointments: completedRes.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dashboard stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;

