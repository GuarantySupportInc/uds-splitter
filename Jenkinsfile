pipeline {
    agent any

    options {
        skipStagesAfterUnstable()
    }

    stages {
		stage('Setup') {
            steps {
                script {
                    env.GIT_LOCAL_BRANCH = get_git_branch(env.GIT_BRANCH)
                }

                sh 'az login --identity'
                sh 'gh auth status'
            }
        }
        stage('Install') {
            environment {
                POTENTIAL_VERSION = sh(returnStdout: true, script: 'echo "$(date +%Y.%m.%d)"').trim()
            }
            steps {
                script {
                    sh 'npm ci'
                    sh 'git tag -d "v${POTENTIAL_VERSION}" || true' // Remove local git tags
                    sh 'git tag -a "v${POTENTIAL_VERSION}" -m "Version ${POTENTIAL_VERSION}"'
                    sh 'npm version from-git --no-git-tag-version'
                    sh 'npm run make -- --platform win32'
                    sh 'npm run make -- --platform linux'
                }
            }
        }
        stage('Test') {
            environment {
                // https://www.electronjs.org/docs/latest/tutorial/testing-on-headless-ci
                // https://stackoverflow.com/a/40678605
                DISPLAY = '1'
            }
            steps {
                script {
                    sh 'npm test'
                    sh 'npm run wdio-headless'
                }
            }
        }
        stage('Scan') {
            environment {
                // SNYK
                SNYK_TOKEN = credentials('snyk')
                SNYK_CFG_ORG = 'guaranty-support-inc'
            }
            steps {
                script {
                    sh 'snyk.sh auth ${SNYK_TOKEN}'
                    sh 'snyk.sh ignore --file-path=./node_modules'
                    sh 'snyk.sh ignore --file-path=./out'
                    sh 'snyk.sh code test'
                }
            }
        }
        stage('Remote Build') {
            environment {
                GITHUB_TOKEN = sh(returnStdout: true, script: 'gh auth token')
            }
            steps {
                script {
                    sh 'git push origin "v$(date +%Y.%m.%d)"'
                    sh 'npm run publish'
                }
            }
        }
    }
    post {
        always {
            script {
                expose_jenkins_properties_to_env()
            }
        }
    }
}

def get_git_branch(String branch) {
    return branch.substring(branch.indexOf('/') + 1)
}

def expose_jenkins_properties_to_env() {
    env.JENKINS_RESULT = currentBuild.result
    env.JENKINS_DURATION = currentBuild.duration
}