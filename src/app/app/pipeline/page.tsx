import { getPipeline } from "@/app/actions/pipeline";
import PipelineBoard from "@/components/PipelineBoard";

export default async function PipelinePage() {
  const applications = await getPipeline();
  return <PipelineBoard initialApplications={applications} />;
}
