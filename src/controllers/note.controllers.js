import { ProjectNote } from "../models/note.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";

const getProjectNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const notes = await ProjectNote.find({ project: projectId })
    .populate("createdBy", "username fullName")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Project notes fetched successfully"));
});

const createProjectNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Note content is required");
  }

  const note = await ProjectNote.create({
    project: projectId,
    createdBy: req.user._id,
    content: content.trim(),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, note, "Project note created successfully"));
});

const getProjectNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const note = await ProjectNote.findOne({ _id: noteId, project: projectId })
    .populate("createdBy", "username fullName");

  if (!note) {
    throw new ApiError(404, "Project note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Project note fetched successfully"));
});

const updateProjectNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Note content is required");
  }

  const note = await ProjectNote.findOneAndUpdate(
    { _id: noteId, project: projectId },
    { $set: { content: content.trim() } },
    { new: true, runValidators: true },
  );

  if (!note) {
    throw new ApiError(404, "Project note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Project note updated successfully"));
});

const deleteProjectNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const note = await ProjectNote.findOneAndDelete({
    _id: noteId,
    project: projectId,
  });

  if (!note) {
    throw new ApiError(404, "Project note not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Project note deleted successfully"));
});

export {
  getProjectNotes,
  createProjectNote,
  getProjectNote,
  updateProjectNote,
  deleteProjectNote,
};
