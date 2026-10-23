import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { reviewsRepo } from "../../../../../lib/repo/reviewsRepo";

export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    const authHeader = req.headers.get("authorization");
    const providedSecret = req.headers.get("x-admin-secret") || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);

    if (adminSecret && providedSecret !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin credentials" }, { status: 401 });
    }

    const body = await req.json();
    const { action, claimId, reviewer = "admin", reason, updatedField, updatedValue } = body;

    if (!claimId || !action) {
      return NextResponse.json({ error: "claimId and action are required" }, { status: 400 });
    }

    let success = false;

    if (action === "approve") {
      success = reviewsRepo.approveClaim(claimId, reviewer);
    } else if (action === "edit") {
      if (!updatedField || updatedValue === undefined) {
        return NextResponse.json({ error: "updatedField and updatedValue are required for edit" }, { status: 400 });
      }
      success = reviewsRepo.editClaim(claimId, updatedField, updatedValue, reason, reviewer);
    } else if (action === "reject") {
      success = reviewsRepo.rejectClaim(claimId, reason || "Rejected by editorial reviewer", reviewer);
    } else {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: "Claim not found in review queue" }, { status: 404 });
    }

    // On-demand ISR revalidation across all public pages
    try {
      revalidatePath("/");
      revalidatePath("/registry");
      revalidatePath("/reconcile");
      revalidatePath("/radar");
      revalidatePath("/changelog");
      revalidatePath("/admin/review");
    } catch {
      // ignore during local dev
    }

    return NextResponse.json({ success: true, action, claimId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
