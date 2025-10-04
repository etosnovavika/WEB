import org.gradle.jvm.tasks.Jar

plugins {
    java
    application
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(files("lib/fastcgi-lib.jar"))
}

application {
    mainClass.set("org.example.Main")
}

tasks.named<Jar>("jar") {
    manifest {
        attributes["Main-Class"] = "org.example.Main"
    }

    from({
        configurations.runtimeClasspath.get()
            .filter { it.name.endsWith(".jar") }
            .map { zipTree(it) }
    })

    exclude("META-INF/*.SF", "META-INF/*.DSA", "META-INF/*.RSA")
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE

    archiveFileName.set("WEB1_2.jar")
}
