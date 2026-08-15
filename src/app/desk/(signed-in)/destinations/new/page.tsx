import { groupFacets, taggingVocabulary } from "@/lib/desk/facets";

import { Head } from "../../bits";
import DestinationForm from "../DestinationForm";

export const dynamic = "force-dynamic";

export default async function NewDestinationPage() {
  const groups = groupFacets(await taggingVocabulary("world"));

  return (
    <>
      <Head eyebrow="The library" title="New destination" />
      <p style={{ maxWidth: "46rem" }}>
        This creates the LOOK and the identity, as a draft. Its voice is written
        on the next screen and is versioned separately — nothing here can change
        a voice a Revelle has already been issued under.
      </p>
      <DestinationForm values={{}} groups={groups} selected={[]} />
    </>
  );
}
