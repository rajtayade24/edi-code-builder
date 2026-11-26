import pytest

torch = pytest.importorskip("torch")
from surgrisk_training.networks import VitalBiLSTM, ComorbidityGraphAttention


def test_bilstm_forward_shape():
    model = VitalBiLSTM(input_size=7, hidden_size=16, num_layers=1, dropout=0.0)
    x = torch.randn(3, 8, 7)
    lengths = torch.tensor([8, 5, 1])
    out = model(x, lengths)
    assert out.shape == (3,)


def test_gat_forward_shape():
    model = ComorbidityGraphAttention(condition_vocab_size=10, embedding_dim=8, hidden_size=16, num_heads=4)
    ids = torch.tensor([[2, 3, 0], [4, 0, 0]])
    severity = torch.tensor([[0, 2, 0], [1, 0, 0]])
    active = torch.tensor([[1.0, 1.0, 0.0], [1.0, 0.0, 0.0]])
    lengths = torch.tensor([2, 1])
    out = model(ids, severity, active, lengths)
    assert out.shape == (2,)
