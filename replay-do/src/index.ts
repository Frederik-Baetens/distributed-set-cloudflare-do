import { DurableObject } from "cloudflare:workers";
import { z } from "zod";

export interface Env {
	REPLAY_DO: DurableObjectNamespace<ReplayDO>;
	SHARDING_LENGTH: number;
}

const ReportDataSchema = z.object({
	reportIDs: z.array(z.string()),
});

type ReportData = z.infer<typeof ReportDataSchema>;


export class ReplayDO extends DurableObject {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async alreadySeen(reportID: string): Promise<boolean> {
		if (await this.ctx.storage.get(reportID) === undefined) {
			// This is not idempotent, so retrying will make this return true
			await this.ctx.storage.put(reportID, true); // we've now seen this value, so mark it.
			return false;
		} else {
			return true;
		}
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	    const body = await request.json();

		const data: ReportData = ReportDataSchema.parse(body);

		const promises = data.reportIDs.map(async (reportID: string) => {
			const stub = getStubForReportID(reportID, env);
			return await checkReportID(reportID, stub);
		});

		const results: boolean[] = await Promise.all(promises);

		const batchResult = results.some((result: boolean) => result);

		return new Response(String(batchResult));
	},
};

async function checkReportID(reportID: string, stub: DurableObjectStub<ReplayDO>): Promise<boolean> {
	return await stub.alreadySeen(reportID);
}

function getStubForReportID(reportID: string, env: Env): DurableObjectStub<ReplayDO> {
	let id: DurableObjectId = env.REPLAY_DO.idFromName("test10" + reportID.slice(0, env.SHARDING_LENGTH));

	let locationHint = getLocationHint();

	return env.REPLAY_DO.get(id, {locationHint});
}

function getLocationHint(): DurableObjectLocationHint {
	const desiredLocationHints: DurableObjectLocationHint[] = ["wnam", "enam", "weur", "eeur"];
	return desiredLocationHints[Math.floor(Math.random() * desiredLocationHints.length)];
}
