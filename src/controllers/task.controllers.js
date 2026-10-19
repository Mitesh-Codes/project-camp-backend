import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { Tasks as Task } from "../models/task.models.js";
import { Subtask } from "../models/subtask.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";


const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    const tasks = await Task.find({ 
        project: new mongoose.Types.ObjectId(projectId) })
        .populate("assignedTo", "avatar username fullName");

    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status} = req.body;
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const files = req.files || [];

    const attachments = files.map((file) => {
        return {
            url: `${process.env.SERVER_URL}/images/${file.filename}`,
            mimetype: file.mimetype,
            size: file.size,
        }
    })

    const task  = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo: assignedTo ?  new mongoose.Types.ObjectId(assignedTo) : undefined,
        status,
        assignedBy: new mongoose.Types.ObjectId(req.user._id), 
        attachments
    });

    return res
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully"));

});

const getTaskbyId = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const task = await Task.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(taskId),
          project: new mongoose.Types.ObjectId(req.params.projectId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
          pipeline: [
            {
              $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "subtasks",
          localField: "_id",
          foreignField: "task",
          as: "subtasks",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      username: 1,
                      fullName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                createdBy: { $arrayElemAt: ["$createdBy", 0] },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          assignedTo: { $arrayElemAt: ["$assignedTo", 0] },
        },
      },
    ]);

    if(!task || task.length === 0) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title, description, status, assignedTo, attachments } = req.body;
    const update = { title, description, status, attachments };

    if (assignedTo !== undefined) {
      update.assignedTo = assignedTo
        ? new mongoose.Types.ObjectId(assignedTo)
        : null;
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: taskId,
        project: req.params.projectId,
      },
      update,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if(!task) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
  const task = await Task.findOne({
      _id: taskId,
      project: req.params.projectId,
    });

    if(!task) {
        throw new ApiError(404, "Task not found");
    }

  await Subtask.deleteMany({ task: taskId });
  await Task.deleteOne({ _id: taskId, project: req.params.projectId });

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
    const { title, isCompleted } = req.body;
    const { taskId } = req.params;

    const task = await Task.findOne({
      _id: taskId,
      project: req.params.projectId,
    });

    if (!task) {
      throw new ApiError(404, "Task not found in this project");
    }

    const subtask = await Subtask.create({
        title,
        task: new mongoose.Types.ObjectId(taskId),
        isCompleted,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    if(!subtask) {
        throw new ApiError(400, "Failed to create subtask");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;
  const { title, isCompleted } = req.body;

  const update = {};
  if (req.user.role === UserRolesEnum.MEMBER) {
    if (title !== undefined || typeof isCompleted !== "boolean") {
      throw new ApiError(400, "Members may only update subtask completion");
    }
    update.isCompleted = isCompleted;
  } else {
    if (title !== undefined) update.title = title;
    if (isCompleted !== undefined) update.isCompleted = isCompleted;
  }

  const existingSubtask = await Subtask.findById(subtaskId).select("task");
  if (!existingSubtask) {
    throw new ApiError(404, "Subtask not found");
  }

  const parentTask = await Task.findOne({
    _id: existingSubtask.task,
    project: req.params.projectId,
  });
  if (!parentTask) {
    throw new ApiError(404, "Subtask not found in this project");
  }

  const subtask = await Subtask.findByIdAndUpdate(
    subtaskId,
    { $set: update },
    { returnDocument: "after", runValidators: true },
  );

  if (!subtask) {
    throw new ApiError(404, "Subtask not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;

  const existingSubtask = await Subtask.findById(subtaskId).select("task");
  if (!existingSubtask) {
    throw new ApiError(404, "Subtask not found");
  }

  const parentTask = await Task.findOne({
    _id: existingSubtask.task,
    project: req.params.projectId,
  });
  if (!parentTask) {
    throw new ApiError(404, "Subtask not found in this project");
  }

  const subtask = await Subtask.findByIdAndDelete(subtaskId);

  if (!subtask) {
    throw new ApiError(404, "Subtask not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask deleted successfully"));
});

export {
    createSubTask,
    createTask,
    deleteSubTask,
    deleteTask,
    getTaskbyId,
    getTasks,
    updateSubTask,
    updateTask
}

