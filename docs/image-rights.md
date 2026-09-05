# Where images may come from

**Research, 2026-09-04. General information, not legal advice — no attorney-client
relationship arises from it, and anything load-bearing should be confirmed by an IP
lawyer before images touch a member surface, a printed deliverable, or marketing.**

Written down because it was delivered as a conversation and a finding that lives only
where it was found gets rediscovered at full price (rule 20).

## How Pinterest gets its images — the founder's question

**Pinterest picks nothing.** Every image is there because a USER put it there, two
ways: uploading their own file, or "pinning" from any webpage via the Save button,
which **copies that image onto Pinterest's servers** and stores a link back to the page
it came from.

So the corpus is the open web, filtered through what people found worth keeping.
Pinterest never chose one, never licensed one, and does not know who owns them.

**Which is why a pin cannot clear rights.** The "source" on a pin is the page a user
pinned it FROM, not the copyright holder. A blog took it from a magazine, someone
pinned the blog, someone repinned the pin. The chain is usually broken and the source
link is often dead.

## Why their model does not transfer to us

Pinterest's protection is **17 U.S.C. § 512(c)** — safe harbour for a service provider
storing material "at the direction of a user." *Harrington v. Pinterest* (N.D. Cal.,
Jan. 2026) granted them summary judgment and was strikingly generous: algorithmic
recommendation, reformatting, and pushing images into email all stayed inside it.

**The fault line is not curation. It is HUMAN APPROVAL.** *Mavrix Photographs v.
LiveJournal* (9th Cir. 2017) held that where human moderators screen and approve
submissions before posting, there is a triable question whether the content was posted
at the COMPANY's direction — potentially destroying the harbour.

Our `/desk/images` loop is structurally *Mavrix*: a model proposes, **a human approves
or refuses**. And worse, because no user submitted anything — a script harvested it.
There is no user in the chain to be shielded behind. A company that selects images and
puts them in its own product is the publisher, facing direct liability under § 106(1)
(reproduction) and § 106(5) (public display), with no safe harbour available.

## Four things that surprised, in order of how much they cost

**1. "Only paying members see it" is an aggravator, not a defence.** § 101 defines
"publicly" to reach transmission to the public whether or not they receive it in the
same place or at the same time; subscribers are the public. And the paywall supplies
direct commercial benefit traceable to the specific images — the exact showing that is
hard to make against Pinterest and easy against us.

**2. Internal-only use has a squarely adverse case in our own circuit.** *American
Geophysical Union v. Texaco* (2d Cir. 1994): a for-profit company photocopying journal
articles **purely for internal reference** was not fair use, partly because it displaced
licences it could have bought. Reproduction is a separate right from display and has no
"publicly" limiter — downloading into Postgres completed a reproduction the day the
script ran.

**3. Metadata stripping is its own claim.** A harvesting script that discards EXIF/IPTC
creator and copyright fields can violate § 1202(b) independently of infringement:
**$2,500–$25,000 per image**, no publication required. On a few hundred images that is
arithmetically larger than the underlying exposure for unregistered works.

**4. The server test does not help us and our circuit rejects it.** *Perfect 10 v.
Amazon* (9th Cir. 2007) protects the party that stores nothing; SDNY rejected it twice
(*Goldman*, *Nicklen*) and the Fifth Circuit rejected it in 2026. We are in the Second
Circuit, and we store the files.

## The ruling this produced

Founder, 2026-09-04: **"dont keep the photos, I have them anyway."**

So the image bank keeps the LABEL and a HASH and deletes the file. That is also where
the research landed: *Bartz v. Anthropic* (N.D. Cal., June 2025) separates the
transformative operation from the acquisition and retention of a corpus, and held
training itself fair use while a retained library of pirated copies was not. **The
classification is our strongest ground; the retained corpus was our weakest.** Deleting
converts an archive into a metadata set.

Also note *Warhol v. Goldsmith* (2023) narrowed "transformative": where a use shares
substantially the same purpose as the original and is commercial, factor one favours the
owner. Using a party photograph as party-design reference is CLOSER to the original
purpose than Warhol's silkscreen was, not further.

## If images are ever wanted in the product

- **Licensed stock** — editorial-use-only cannot appear in a commercial product at all.
  Royalty-free has caps and usually excludes anything where the image is the value.
  Model and property releases are the gate; party photography is dense with both.
  The indemnity (Getty, Shutterstock, Adobe) is the real product being bought.
- **Commissioned** — assume we own NOTHING absent a signed writing. *CCNV v. Reid*
  (1989): an independent contractor's work is not work-for-hire under prong one, and
  prong two needs a signed agreement AND one of nine enumerated categories, which
  standalone photographs fit only awkwardly. Use a written **§ 204(a) assignment**, and
  get the releases from the photographer's shoot.
- **Public domain / CC0** — the licence is only as good as the uploader's rights, and
  Unsplash/Pexels/Pixabay vet nothing and indemnify nothing. Downstream users are
  strictly liable; innocent infringement mitigates damages, it is not a defence.
- **Generated** — likely unprotectable (*Thaler v. Perlmutter*, D.C. Cir. 2025, cert
  denied), so a competitor may copy it. Input risk is provider-dependent; Adobe Firefly
  indemnifies on qualifying plans and most consumer generators do not.

**The realistic route to owned, member-visible imagery is commissioned photography with
a written assignment and releases** — which also gives an exclusive visual identity that
neither stock nor generated images can.
