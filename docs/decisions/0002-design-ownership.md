# 0002: Shared design and behavior ownership

Status: Adopted; describes the existing design direction and current ownership.

Context: Repeated page-specific styling created inconsistent spacing and menu offsets.

Decision: packages/design-tokens/tokens.css owns global values (extracted by decision 0003); app-theme.css owns stylesheet order; browse-layout.css owns browsing/paging; UIControls/WorkspaceUI own shared controls/structure; PopoverPosition owns menu anchoring. Pages supply state, labels and actions. Charcoal/warm-white/cherry is the shared palette; stable people/tag identity accents remain scoped.

Consequences: fix the owner rather than adding a final override. Maintain style-contracts and behavioral smoke checks. Extract these into packages only after removing app-specific dependencies. Preserve grid browsing, bottom paging, focus recovery and live queue behavior.
