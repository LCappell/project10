const express = require("express");
const router = express.Router();
const Course = require("../models").Course;
const User = require("../models").User;
const { asyncHandler } = require("../middleware/async-handler");
const { authenticateUser } = require("../middleware/auth-user");

// GET route that returns a list of all courses
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const course = await Course.findAll({
      // This will return all course details and the selected User attributes.
      attributes: [
        "id",
        "title",
        "description",
        "estimatedTime",
        "materialsNeeded",
      ],
      include: {
        model: User,
        attributes: ["id", "firstName", "lastName", "emailAddress", "password"],
      },
    });
    if (course) {
      res.status(200).json(course);
    } else {
      res.status(404).json({ message: "No courses were found." });
    }
  })
);

// POST route that will create a new course.

router.post(
  "/",
  authenticateUser,
  asyncHandler(async (req, res) => {
    // Data is assigned to newCourse variable
    let newCourse = req.body;
    try {
      const course = await Course.create(newCourse);
      const { id } = course;
      // id is appended to the url
      res.location("/api/courses/" + id).end();
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  })
);

// GET route that will return a specific course
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id, {
      // Returns selected attributes
      attributes: [
        "id",
        "title",
        "description",
        "estimatedTime",
        "materialsNeeded",
      ],
      include: {
        model: User,
        attributes: ["id", "firstName", "lastName", "emailAddress", "password"],
      },
    });
    // If course is found - display course details
    if (course) {
      res.status(200).json(course);
    } else {
      res.status(404).json({ message: "No course has been found!" });
    }
  })
);

// PUT request - This will update the course details
router.put(
  "/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const course = req.body;

    const errors = [];

    // Validate title field
    if (!course.title) {
      errors.push("Please provide a title.");
    }

    // Validate description field
    if (!course.description) {
      errors.push("Please provide a description.");
    }

    try {
      const course = await Course.findByPk(req.params.id);

      // extract the current user from request
      const { currentUser } = req;

      // If course exists..
      if (course) {
        // And if the current user created the content, allow them to edit it. If not, a 403 forbidden is sent.
        if (currentUser.id === course.userId) {
          await course.update(req.body);
          res.status(204).end();
        } else {
          res.status(403).end();
        }
      } else {
        res.status(404).json({
          message: "Unable to update course.",
        });
      }
    } catch (error) {
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeUniqueConstraintError"
      ) {
        const errors = error.errors.map((err) => err.message);
        res.status(400).json({ errors });
      } else {
        throw error;
      }
    }
  })
);

// DELETE route that will delete the selected course
router.delete(
  "/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);

    const { currentUser } = req;

    // If the course exists
    if (course) {
      if (currentUser.id === course.userId) {
        await course.destroy();
        res.status(204).end();
      } else {
        res.status(403).end();
      }
    } else {
      res.status(404).json({ message: "Couldn't delete this course" });
    }
  })
);

module.exports = router;
