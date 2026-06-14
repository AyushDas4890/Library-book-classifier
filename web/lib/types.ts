export interface Book {
  id: number;
  title: string;
  creator: string;
  subjects: string;
  checkouts: number;
  cluster: number;
  pc1: number;
  pc2: number;
}

export interface ClusterProfile {
  cluster: number;
  label: string;
  size: number;
  share: number;
  top_features: { feature: string; label: string; z: number; direction: string }[];
}

export interface Metrics {
  data: { raw_rows: number; distinct_titles: number; modelled_titles: number; source: string };
  clustering: { k: number; silhouette: number; davies_bouldin: number; calinski_harabasz: number; n_titles: number };
  k_selection: { k: number; silhouette: number; davies_bouldin: number }[];
  clusters: ClusterProfile[];
  encoder?: { name: string; dim: number };
  web_encoder?: { name: string; dim: number; tokens: number };
}

export interface Hit extends Book {
  score: number;
}
