"""Inference-side copies of the Phase 5 neural architectures; keep in sync with training code."""
import torch
from torch import nn


class VitalBiLSTM(nn.Module):
    def __init__(self, input_size, hidden_size=64, num_layers=1, dropout=0.1):
        super().__init__()
        self.lstm = nn.LSTM(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, batch_first=True, bidirectional=True, dropout=dropout if num_layers > 1 else 0.0)
        self.head = nn.Sequential(nn.LayerNorm(hidden_size * 2), nn.Dropout(dropout), nn.Linear(hidden_size * 2, hidden_size), nn.ReLU(), nn.Dropout(dropout), nn.Linear(hidden_size, 1))
    def forward(self, sequences, lengths):
        output, _ = self.lstm(sequences)
        indices = (lengths - 1).clamp(min=0)
        selected = output[torch.arange(output.size(0), device=output.device), indices]
        return self.head(selected).squeeze(-1)

class ComorbidityGraphAttention(nn.Module):
    def __init__(self, condition_vocab_size, embedding_dim=24, hidden_size=64, num_heads=4):
        super().__init__()
        self.condition_embedding = nn.Embedding(condition_vocab_size, embedding_dim, padding_idx=0)
        self.severity_embedding = nn.Embedding(4, 8, padding_idx=0)
        input_size = embedding_dim + 8 + 1
        self.input_projection = nn.Linear(input_size, hidden_size)
        self.attention = nn.MultiheadAttention(hidden_size, num_heads, batch_first=True, dropout=0.1)
        self.norm = nn.LayerNorm(hidden_size)
        self.pool_score = nn.Linear(hidden_size, 1)
        self.classifier = nn.Sequential(nn.Linear(hidden_size, hidden_size // 2), nn.ReLU(), nn.Dropout(0.1), nn.Linear(hidden_size // 2, 1))
    def forward(self, condition_ids, severity_ids, active_values, lengths):
        condition = self.condition_embedding(condition_ids)
        severity = self.severity_embedding(severity_ids)
        node_features = self.input_projection(torch.cat([condition, severity, active_values.unsqueeze(-1)], dim=-1))
        padding_mask = torch.arange(condition_ids.size(1), device=condition_ids.device)[None, :] >= lengths[:, None]
        attended, _ = self.attention(node_features, node_features, node_features, key_padding_mask=padding_mask, need_weights=False)
        attended = self.norm(node_features + attended)
        scores = self.pool_score(attended).squeeze(-1).masked_fill(padding_mask, -1e9)
        weights = torch.softmax(scores, dim=1)
        pooled = torch.sum(attended * weights.unsqueeze(-1), dim=1)
        return self.classifier(pooled).squeeze(-1)
