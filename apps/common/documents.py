from datetime import datetime, timezone


def utcnow():
    return datetime.now(timezone.utc)


class Location:
    def __init__(self, address="", village="", district="", state=""):
        self.address = address
        self.village = village
        self.district = district
        self.state = state

    def to_dict(self):
        return {
            "address": self.address,
            "village": self.village,
            "district": self.district,
            "state": self.state,
        }

    @classmethod
    def from_dict(cls, data):
        if data is None:
            return None
        return cls(
            address=data.get("address", ""),
            village=data.get("village", ""),
            district=data.get("district", ""),
            state=data.get("state", ""),
        )
