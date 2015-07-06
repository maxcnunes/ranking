1. Is the new number higher than the highest number in the branch?
  - Yes:
    1. Has the current branch already reached the limit of nodes per branch?
      - Yes:
        1. Reorganize the current branch equally to include the new value and with the same limit of nodes.
        2. Reorganize the children branches.
      - No:
        1. Include the value as a new node.
  - No:
    1. Includes the value in the child node.
