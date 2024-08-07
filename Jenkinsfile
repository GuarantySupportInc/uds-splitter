pipeline {
    agent any

    options {
        skipStagesAfterUnstable()
    }

    environment {
        // SNYK
        SNYK_TOKEN = credentials('snyk')
        SNYK_CFG_ORG = 'guaranty-support-inc'

        // https://www.electronjs.org/docs/latest/tutorial/testing-on-headless-ci
        // https://stackoverflow.com/a/40678605
        DISPLAY = '1'

        AZURE_REPOSITORY = 'insolvregistry.azurecr.io'
    }

    stages {
		stage('Setup') {
            steps {
                script {
                    env.GIT_LOCAL_BRANCH = get_git_branch(env.GIT_BRANCH)
                }

                sh 'az config set defaults.acr=${AZURE_REPOSITORY}'
                sh 'az login --identity'
                sh 'az acr login --name ${AZURE_REPOSITORY}'
                sh 'gh auth status'
            }
        }
        stage('Install') {
            steps {
                script {
                    sh 'npm ci'
                    sh 'git tag -a "v$(date +%Y.%m.%d)" -m "Version $(date +%Y.%m.%d)"'
                    sh 'npm --no-git-tag-version version'
                    sh 'npm version from-git'
                    sh 'npx electron-forge make'
                }
            }
        }
        stage('Test') {
            steps {
                script {
                    sh 'npm test'
                    sh 'npm run wdio'
                }
            }
        }
        stage('Scan') {
            steps {
                script {
                    sh 'snyk auth ${SNYK_TOKEN}'
                    sh 'snyk ignore --file-path=./node_modules'
                    sh 'snyk ignore --file-path=./out'
                    sh 'snyk code test'
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
