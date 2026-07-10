import { sleep } from "workflow";

// Durable workflow steps
async function createUser(email: string) {
  "use step";
  console.log(`[Workflow Step]: Creating user profile in database for ${email}`);
  return {
    id: "usr_" + Math.random().toString(36).slice(2, 9),
    email,
    createdAt: new Date().toISOString()
  };
}

async function sendWelcomeEmail(user: { id: string; email: string }) {
  "use step";
  console.log(`[Workflow Step]: Transmission welcome_email successfully sent to client: ${user.email}`);
  return { success: true, timestamp: new Date().toISOString() };
}

async function sendOnboardingEmail(user: { id: string; email: string }) {
  "use step";
  console.log(`[Workflow Step]: Transmission onboarding_email successfully sent to client: ${user.email}`);
  return { success: true, timestamp: new Date().toISOString() };
}

/**
 * Orchestrates the durable user onboarding process
 */
export async function handleUserSignup(email: string) {
  "use workflow";

  const user = await createUser(email);
  await sendWelcomeEmail(user);

  // Durable non-blocking sleep (survives restarts/deployments)
  await sleep("5s");

  await sendOnboardingEmail(user);
  return { userId: user.id, status: "onboarded" };
}
