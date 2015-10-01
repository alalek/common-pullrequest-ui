#!/bin/bash -e
if ! git diff-index --quiet HEAD --; then
  echo "You have uncommited changes. Please commit your changes first"
  exit 1
fi

BRANCH=`git rev-parse --abbrev-ref HEAD`
HASH=`git rev-parse HEAD`
COMMIT_MESSAGE=`git log -1 --pretty=format:'%B' HEAD`
while true; do
  read GIT_AUTHOR_NAME
  read GIT_AUTHOR_EMAIL
  read GIT_AUTHOR_DATE
  read GIT_COMMITTER_NAME
  read GIT_COMMITTER_EMAIL
  read GIT_COMMITTER_DATE
  read UPDATE_DATE
  UPDATE_DATE=$(date --date="@"${UPDATE_DATE} -u --rfc-3339=date)
  export \
    GIT_AUTHOR_NAME \
    GIT_AUTHOR_EMAIL \
    GIT_AUTHOR_DATE \
    GIT_COMMITTER_NAME \
    GIT_COMMITTER_EMAIL \
    GIT_COMMITTER_DATE
  break
done < <(git log -1 --pretty=format:'%an%n%ae%n%aD%n%cn%n%ce%n%cD%n%ct%n' HEAD)

echo "Current branch is ${BRANCH}: ${HASH}"
./scripts/build_dist.sh
git checkout -B ${BRANCH}_with_dist ${BRANCH}

# cache custom git scripts
git_bin_dir="`git rev-parse --git-dir`/bin"
mkdir -p ${git_bin_dir} && cp -rf scripts/git/* ${git_bin_dir}
PATH="${git_bin_dir}:${PATH}"

cleanup()
{
  set +e
  git branch -D ${BRANCH}_with_dist
  git subtree split --prefix dist -b dist_${BRANCH} dist_merge_${BRANCH}
  git subtree_ex split --prefix dist --write_prefix dist -b dist/${BRANCH} dist_merge_${BRANCH}
  git checkout ${BRANCH}
}


git add -f dist
git status
if git diff-index --quiet HEAD --; then
  echo "Dist is empty. Nothing to commit"
  git checkout ${BRANCH}
  git branch -D ${BRANCH}_with_dist
  exit 1
fi
git commit -n -F- <<EOF
(dist ${UPDATE_DATE}) ${COMMIT_MESSAGE}

${HASH}
EOF
git checkout -B dist_merge_${BRANCH} dist_merge_${BRANCH} || (
  git checkout -B dist_merge_${BRANCH} 03e98e2dcbbeade39a67acc2c013f223579aae0b
)
git merge --no-commit -s ours ${BRANCH}
git rm -rf . || true
git checkout ${BRANCH}_with_dist -- dist
git status
if git diff-index --quiet HEAD --; then
  echo "Nothing to commit into update"
  cleanup
  exit 1
fi
git commit -n -F- <<EOF
(dist ${UPDATE_DATE}) ${COMMIT_MESSAGE}

${HASH}
EOF
cleanup
