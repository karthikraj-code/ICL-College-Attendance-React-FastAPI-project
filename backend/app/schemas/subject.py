from pydantic import BaseModel, Field


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    code: str = Field(min_length=1, max_length=50)


class SubjectRead(BaseModel):
    id: int
    name: str
    code: str

    model_config = {"from_attributes": True}
