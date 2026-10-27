from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    roll_number: str = Field(min_length=1, max_length=50)
    email: str = Field(min_length=3, max_length=120)


class StudentRead(BaseModel):
    id: int
    name: str
    roll_number: str
    email: str

    model_config = {"from_attributes": True}
