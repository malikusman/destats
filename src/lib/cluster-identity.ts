import type { NodeRecord } from '../types/netapp';

export interface ClusterIdentity {
  /** Cluster label derived from node hostnames (e.g. uspdc-nac01 from uspdc-nac01-01). */
  clusterName: string | null;
  /** First non-empty node location from ONTAP, if present. */
  location: string | null;
  /** ONTAP version string from a node, if present. */
  ontapVersion: string | null;
}

/**
 * Derive a cluster display name from live node records.
 * ONTAP node names are typically `<cluster>-<nn>`; we strip a trailing numeric suffix
 * and use the most common base. Falls back to the first node name when no pattern matches.
 */
export function deriveClusterIdentity(nodes: NodeRecord[]): ClusterIdentity {
  const names = nodes.map((n) => n.name?.trim()).filter((n): n is string => Boolean(n));

  let clusterName: string | null = null;
  if (names.length > 0) {
    const bases = names.map((name) => name.replace(/-\d+$/, ''));
    const counts = new Map<string, number>();
    for (const base of bases) {
      counts.set(base, (counts.get(base) ?? 0) + 1);
    }
    let best = bases[0];
    let bestCount = 0;
    for (const [base, count] of counts) {
      if (count > bestCount) {
        best = base;
        bestCount = count;
      }
    }
    clusterName = best || names[0] || null;
  }

  const location =
    nodes.map((n) => n.location?.trim()).find((loc): loc is string => Boolean(loc)) ?? null;

  const ontapVersion =
    nodes
      .map((n) => {
        const full = n.version?.full;
        if (!full) return null;
        return full.match(/NetApp Release ([^:]+)/)?.[1] ?? full;
      })
      .find((v): v is string => Boolean(v)) ?? null;

  return { clusterName, location, ontapVersion };
}
