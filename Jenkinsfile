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

                sh 'chmod +x build/*.sh'
                sh 'az login --identity'
                sh 'gh auth status'
            }
        }
        stage('Install') {
            environment {
                POTENTIAL_VERSION = sh(returnStdout: true, script: 'echo "$(date +%Y.%m.%d)"').trim()
                CURRENT_COMMIT = sh(returnStdout: true, script: 'git log -1 | sed -n "s/^commit //p"')
            }
            steps {
                script {
                    sh 'build/notify-github.sh "pending" "Setting up environment"'
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
                    sh 'build/notify-github.sh "pending" "Testing"'
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
                    sh 'build/notify-github.sh "pending" "Synk Scan"'
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
                    sh 'build/notify-github.sh "pending" "Publishing"'
                    sh 'git push origin "v$(date +%Y.%m.%d)"'
                    sh 'npm run publish'
                }
            }
        }
    }
    post {
        success {
            sh 'build/notify-github.sh "success" "Build was successful"'
        }
        failure {
            sh 'build/notify-github.sh "failure" "Testing has failed"'
        }
        aborted {
            sh 'build/notify-github.sh "failure" "Build was aborted partway"'
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
